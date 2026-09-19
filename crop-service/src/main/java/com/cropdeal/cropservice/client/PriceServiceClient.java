package com.cropdeal.cropservice.client;

import com.cropdeal.cropservice.dto.PriceRangeResponse;
import com.cropdeal.cropservice.dto.PriceSearchRequest;
import com.cropdeal.cropservice.exception.PriceNotFoundException;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PriceServiceClient {
    private final RestClient restClient;

    public PriceServiceClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public PriceRangeResponse getCurrentPrice(PriceSearchRequest request) {
        try {
            PriceRangeResponse response = restClient.post()
                    .uri("/api/prices/lookup")
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        throw new PriceNotFoundException(
                                "Current mandi price is not available for the selected commodity, location and grade");
                    })
                    .body(PriceRangeResponse.class);

            if (response == null || response.maxPricePerKg() == null || response.maxPricePerKg().signum() <= 0) {
                throw new PriceNotFoundException(
                        "Current mandi price is not available for the selected commodity, location and grade");
            }
            return response;
        } catch (PriceNotFoundException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new PriceNotFoundException("Price Service is unavailable. Cannot validate the crop price");
        }
    }
}
