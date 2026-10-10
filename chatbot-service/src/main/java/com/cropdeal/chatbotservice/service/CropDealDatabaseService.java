package com.cropdeal.chatbotservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class CropDealDatabaseService {

    private static final Logger log = LoggerFactory.getLogger(CropDealDatabaseService.class);
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;

    @Value("${cropdeal.price-service.url:http://localhost:8084}")
    private String priceServiceUrl;

    @org.springframework.beans.factory.annotation.Autowired
    public CropDealDatabaseService(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
        this.restTemplate = new RestTemplate();
        log.info("CropDealDatabaseService initialized with DataSource successfully!");
    }

    // =========================================================================
    // DTO Records
    // =========================================================================
    public record CropRecord(
            Long id,
            Long farmerId,
            String commodity,
            String state,
            String district,
            String grade,
            BigDecimal quantity,
            String unit,
            BigDecimal pricePerKg,
            String description,
            String status,
            LocalDateTime createdAt
    ) {}

    public record MandiPriceRecord(
            Long id,
            String commodity,
            String variety,
            String grade,
            String state,
            String district,
            String market,
            Double modalPrice,
            Double modalPricePerKg,
            Double minPricePerKg,
            Double maxPricePerKg,
            String sourceUnit,
            LocalDate arrivalDate
    ) {}

    // =========================================================================
    // CROPS POSTED BY FARMERS METHODS
    // =========================================================================
    public List<CropRecord> findCropsByCommodity(String commodity, String location, String grade) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, farmer_id, commodity, state, district, grade, quantity, unit, price_per_kg, " +
                "description, status, created_at FROM cropdeal_crop_db.crops WHERE status = 'PUBLISHED' ");
        List<Object> params = new ArrayList<>();

        if (commodity != null && !commodity.isBlank()) {
            sql.append("AND (LOWER(commodity) LIKE ? OR LOWER(description) LIKE ?) ");
            String pattern = "%" + commodity.toLowerCase().trim() + "%";
            params.add(pattern);
            params.add(pattern);
        }

        if (location != null && !location.isBlank()) {
            sql.append("AND (LOWER(district) LIKE ? OR LOWER(state) LIKE ?) ");
            String locPattern = "%" + location.toLowerCase().trim() + "%";
            params.add(locPattern);
            params.add(locPattern);
        }

        if (grade != null && !grade.isBlank()) {
            sql.append("AND UPPER(grade) = ? ");
            params.add(grade.toUpperCase().trim());
        }

        sql.append("ORDER BY id DESC LIMIT 10");

        try {
            return jdbcTemplate.query(sql.toString(), new CropRowMapper(), params.toArray());
        } catch (DataAccessException ex) {
            log.warn("Database query for crops failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<CropRecord> getAllActiveCrops(int limit) {
        String sql = "SELECT id, farmer_id, commodity, state, district, grade, quantity, unit, price_per_kg, " +
                "description, status, created_at FROM cropdeal_crop_db.crops " +
                "WHERE status = 'PUBLISHED' ORDER BY id DESC LIMIT ?";
        try {
            return jdbcTemplate.query(sql, new CropRowMapper(), limit);
        } catch (DataAccessException ex) {
            log.warn("Database query for all active crops failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    // =========================================================================
    // MANDI MARKET PRICE METHODS
    // =========================================================================
    public List<MandiPriceRecord> findMandiPrices(String commodity, String location, int limit) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, commodity, variety, grade, state, district, market, modal_price, " +
                "modal_price_per_kg, min_price_per_kg, max_price_per_kg, source_unit, arrival_date " +
                "FROM cropdeal_price_db.market_prices ");
        List<Object> params = new ArrayList<>();

        boolean whereAdded = false;
        if (commodity != null && !commodity.isBlank()) {
            sql.append("WHERE LOWER(commodity) LIKE ? ");
            params.add("%" + commodity.toLowerCase().trim() + "%");
            whereAdded = true;
        }

        if (location != null && !location.isBlank()) {
            sql.append(whereAdded ? "AND " : "WHERE ");
            sql.append("(LOWER(district) LIKE ? OR LOWER(market) LIKE ? OR LOWER(state) LIKE ?) ");
            String locPattern = "%" + location.toLowerCase().trim() + "%";
            params.add(locPattern);
            params.add(locPattern);
            params.add(locPattern);
        }

        sql.append("ORDER BY arrival_date DESC, id DESC LIMIT ?");
        params.add(limit);

        try {
            return jdbcTemplate.query(sql.toString(), new MandiPriceRowMapper(), params.toArray());
        } catch (DataAccessException ex) {
            log.warn("Database query for mandi prices failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<MandiPriceRecord> getSampleMandiPrices(int limit) {
        String sql = "SELECT id, commodity, variety, grade, state, district, market, modal_price, " +
                "modal_price_per_kg, min_price_per_kg, max_price_per_kg, source_unit, arrival_date " +
                "FROM cropdeal_price_db.market_prices " +
                "ORDER BY arrival_date DESC, id DESC LIMIT ?";
        try {
            return jdbcTemplate.query(sql, new MandiPriceRowMapper(), limit);
        } catch (DataAccessException ex) {
            log.warn("Database query for sample mandi prices failed: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    // =========================================================================
    // ROW MAPPERS
    // =========================================================================
    private static class CropRowMapper implements RowMapper<CropRecord> {
        @Override
        public CropRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new CropRecord(
                    rs.getLong("id"),
                    rs.getLong("farmer_id"),
                    rs.getString("commodity"),
                    rs.getString("state"),
                    rs.getString("district"),
                    rs.getString("grade"),
                    rs.getBigDecimal("quantity"),
                    rs.getString("unit"),
                    rs.getBigDecimal("price_per_kg"),
                    rs.getString("description"),
                    rs.getString("status"),
                    rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
            );
        }
    }

    private static class MandiPriceRowMapper implements RowMapper<MandiPriceRecord> {
        @Override
        public MandiPriceRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new MandiPriceRecord(
                    rs.getLong("id"),
                    rs.getString("commodity"),
                    rs.getString("variety"),
                    rs.getString("grade"),
                    rs.getString("state"),
                    rs.getString("district"),
                    rs.getString("market"),
                    rs.getObject("modal_price") != null ? rs.getDouble("modal_price") : null,
                    rs.getObject("modal_price_per_kg") != null ? rs.getDouble("modal_price_per_kg") : null,
                    rs.getObject("min_price_per_kg") != null ? rs.getDouble("min_price_per_kg") : null,
                    rs.getObject("max_price_per_kg") != null ? rs.getDouble("max_price_per_kg") : null,
                    rs.getString("source_unit"),
                    rs.getDate("arrival_date") != null ? rs.getDate("arrival_date").toLocalDate() : null
            );
        }
    }

    // =========================================================================
    // GOVERNMENT API FALLBACK (via price-service)
    // =========================================================================
    /**
     * Calls the price-service /api/prices/commodity/{commodity} endpoint.
     * Returns a GovtPriceResult if found, null otherwise.
     */
    public GovtPriceResult getGovtPriceFromApi(String commodity) {
        try {
            String url = priceServiceUrl + "/api/prices/commodity/" + commodity.trim();
            @SuppressWarnings("rawtypes")
            java.util.Map response = restTemplate.getForObject(url, java.util.Map.class);
            if (response == null) return null;

            GovtPriceResult result = new GovtPriceResult();
            result.commodity = toString(response.get("commodity"));
            result.market = toString(response.get("market"));
            result.district = toString(response.get("district"));
            result.state = toString(response.get("state"));
            result.modalPricePerKg = toDouble(response.get("modalPricePerKg"));
            result.minPricePerKg = toDouble(response.get("minPricePerKg"));
            result.maxPricePerKg = toDouble(response.get("maxPricePerKg"));
            result.arrivalDate = toString(response.get("arrivalDate"));
            log.info("Govt API fallback found price for {}", commodity);
            return result;
        } catch (Exception ex) {
            log.warn("Govt API fallback failed for {}: {}", commodity, ex.getMessage());
            return null;
        }
    }

    private String toString(Object o) { return o != null ? o.toString() : null; }
    private Double toDouble(Object o) {
        if (o == null) return null;
        try { return Double.parseDouble(o.toString()); } catch (Exception e) { return null; }
    }

    public static class GovtPriceResult {
        public String commodity;
        public String market;
        public String district;
        public String state;
        public Double modalPricePerKg;
        public Double minPricePerKg;
        public Double maxPricePerKg;
        public String arrivalDate;
    }
}
