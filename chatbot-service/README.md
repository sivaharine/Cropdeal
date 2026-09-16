# chatbot-service

Spring Boot REST service for Sarvam AI chat completions with in-memory session history.

## Sarvam REST endpoint used

```text
POST https://api.sarvam.ai/v1/chat/completions
Header: api-subscription-key: <your-api-key>
```

## Run

```powershell
$env:SARVAM_API_KEY = "your_sarvam_api_key"
.\mvnw spring-boot:run
```

If you do not have Maven Wrapper files in this folder, use Maven directly:

```powershell
$env:SARVAM_API_KEY = "your_sarvam_api_key"
mvn spring-boot:run
```

The service runs on:

```text
http://localhost:8088
```

## Chat API

Start a new chat session:

```powershell
curl -Method POST http://localhost:8088/api/chat `
  -ContentType "application/json" `
  -Body '{"message":"Say hi in one word"}'
```

Continue the same chat session by passing the returned `sessionId`:

```powershell
curl -Method POST http://localhost:8088/api/chat `
  -ContentType "application/json" `
  -Body '{"sessionId":"returned-session-id","message":"Now say it in Tamil"}'
```

Clear a session from memory:

```powershell
curl -Method DELETE http://localhost:8088/api/chat/sessions/returned-session-id
```

## Request body

```json
{
  "sessionId": "optional-session-id",
  "message": "your user message"
}
```

## Response body

```json
{
  "sessionId": "session-id",
  "reply": "assistant reply"
}
```

There is no database in this service. Chat history is stored only in application memory and is lost when the service restarts.
