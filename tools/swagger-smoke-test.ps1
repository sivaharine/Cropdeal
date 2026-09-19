$ErrorActionPreference = "Stop"

$services = @(
    @{ Name = "auth-service"; Port = 8081 },
    @{ Name = "user-service"; Port = 8082 },
    @{ Name = "price-service"; Port = 8083 },
    @{ Name = "order-service"; Port = 8085 },
    @{ Name = "payment-service"; Port = 8086 },
    @{ Name = "crop-service"; Port = 8087 },
    @{ Name = "chatbot-service"; Port = 8088 },
    @{ Name = "invoice-service"; Port = 8089 },
    @{ Name = "delivery-service"; Port = 8090 },
    @{ Name = "negotiation-service"; Port = 8091 },
    @{ Name = "admin-dashboard-report-service"; Port = 8092 },
    @{ Name = "notification-service"; Port = 8093 },
    @{ Name = "review-service"; Port = 8094 },
    @{ Name = "bidding-service"; Port = 8095 }
)

function Resolve-Schema {
    param($Document, $Schema)

    if ($null -eq $Schema) {
        return $null
    }

    if ($Schema.'$ref') {
        $name = ($Schema.'$ref' -split "/")[-1]
        return Resolve-Schema $Document $Document.components.schemas.$name
    }

    return $Schema
}

function New-SampleValue {
    param($Document, $Schema, [int] $Depth = 0)

    if ($Depth -gt 8 -or $null -eq $Schema) {
        return $null
    }

    $Schema = Resolve-Schema $Document $Schema

    if ($Schema.example) {
        return $Schema.example
    }

    if ($Schema.enum -and $Schema.enum.Count -gt 0) {
        return $Schema.enum[0]
    }

    if ($Schema.type -eq "array") {
        return @(New-SampleValue $Document $Schema.items ($Depth + 1))
    }

    if ($Schema.type -eq "object" -or $Schema.properties) {
        $obj = [ordered]@{}
        foreach ($property in $Schema.properties.PSObject.Properties) {
            $obj[$property.Name] = New-SampleValue $Document $property.Value ($Depth + 1)
        }
        return $obj
    }

    switch ($Schema.format) {
        "int32" { return 1 }
        "int64" { return 1 }
        "float" { return 1.0 }
        "double" { return 1.0 }
        "date" { return "2026-09-18" }
        "date-time" { return "2026-09-18T00:00:00" }
        "email" { return "swagger-test@example.com" }
        default {}
    }

    switch ($Schema.type) {
        "integer" { return 1 }
        "number" { return 1.0 }
        "boolean" { return $true }
        "string" { return "test" }
        default { return "test" }
    }
}

function New-ParameterValue {
    param($Parameter)

    $schema = $Parameter.schema
    if ($schema.enum -and $schema.enum.Count -gt 0) {
        return [string]$schema.enum[0]
    }

    switch ($schema.format) {
        "int32" { return "1" }
        "int64" { return "1" }
        "date" { return "2026-09-18" }
        default {}
    }

    switch ($schema.type) {
        "integer" { return "1" }
        "number" { return "1" }
        "boolean" { return "true" }
        default { return "test" }
    }
}

$results = New-Object System.Collections.Generic.List[object]

foreach ($service in $services) {
    $baseUrl = "http://localhost:$($service.Port)"
    $document = Invoke-RestMethod "$baseUrl/v3/api-docs" -TimeoutSec 15

    foreach ($pathProperty in $document.paths.PSObject.Properties) {
        $path = $pathProperty.Name
        foreach ($methodProperty in $pathProperty.Value.PSObject.Properties) {
            $method = $methodProperty.Name.ToUpperInvariant()
            if ($method -notin @("GET", "POST", "PUT", "PATCH", "DELETE")) {
                continue
            }

            $operation = $methodProperty.Value
            $requestPath = $path
            $query = @{}

            foreach ($parameter in @($operation.parameters)) {
                $value = New-ParameterValue $parameter
                if ($parameter.in -eq "path") {
                    $requestPath = $requestPath.Replace("{$($parameter.name)}", [uri]::EscapeDataString($value))
                } elseif ($parameter.in -eq "query") {
                    $query[$parameter.name] = $value
                }
            }

            $uriBuilder = [System.UriBuilder]::new("$baseUrl$requestPath")
            if ($query.Count -gt 0) {
                $pairs = foreach ($item in $query.GetEnumerator()) {
                    "{0}={1}" -f [uri]::EscapeDataString($item.Key), [uri]::EscapeDataString([string]$item.Value)
                }
                $uriBuilder.Query = ($pairs -join "&")
            }

            $headers = @{}
            $body = $null
            $contentType = $null

            $jsonContent = $operation.requestBody.content.'application/json'
            if ($jsonContent) {
                $body = New-SampleValue $document $jsonContent.schema | ConvertTo-Json -Depth 20
                $contentType = "application/json"
            }

            $statusCode = $null
            $errorMessage = $null

            try {
                $params = @{
                    Method = $method
                    Uri = $uriBuilder.Uri.AbsoluteUri
                    Headers = $headers
                    TimeoutSec = 20
                    UseBasicParsing = $true
                }
                if ($body) {
                    $params.Body = $body
                    $params.ContentType = $contentType
                }
                $response = Invoke-WebRequest @params
                $statusCode = [int]$response.StatusCode
            } catch {
                if ($_.Exception.Response) {
                    $statusCode = [int]$_.Exception.Response.StatusCode
                } else {
                    $statusCode = 0
                }
                $errorMessage = $_.Exception.Message
            }

            $results.Add([pscustomobject]@{
                Service = $service.Name
                Method = $method
                Path = $path
                Status = $statusCode
                Error = $errorMessage
            })
        }
    }
}

$results | Sort-Object Service, Path, Method | Format-Table -AutoSize

$serverErrors = $results | Where-Object { $_.Status -eq 500 -or $_.Status -eq 0 }
if ($serverErrors) {
    Write-Host "`nServer errors found:" -ForegroundColor Red
    $serverErrors | Sort-Object Service, Path, Method | Format-Table -AutoSize
    exit 1
}

Write-Host "`nNo 500-level Swagger endpoint responses found." -ForegroundColor Green
