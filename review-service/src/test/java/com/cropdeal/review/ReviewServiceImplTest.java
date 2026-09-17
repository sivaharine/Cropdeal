package com.cropdeal.review;

import com.cropdeal.review.client.OrderServiceClient;
import com.cropdeal.review.dto.*;
import com.cropdeal.review.entity.FarmerReview;
import com.cropdeal.review.entity.ReviewStatus;
import com.cropdeal.review.event.ReviewEventProducer;
import com.cropdeal.review.exception.DuplicateReviewException;
import com.cropdeal.review.exception.InvalidReviewException;
import com.cropdeal.review.exception.UnauthorizedReviewAccessException;
import com.cropdeal.review.repository.FarmerReviewRepository;
import com.cropdeal.review.service.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private FarmerReviewRepository reviewRepository;

    @Mock
    private OrderServiceClient orderServiceClient;

    @Mock
    private ReviewEventProducer eventProducer;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private FarmerReview review;
    private OrderDto orderDto;

    @BeforeEach
    void setUp() {
        review = new FarmerReview();
        review.setId(1L);
        review.setReviewReference("REV-12345678");
        review.setOrderId(101L);
        review.setCropId(301L);
        review.setDealerId(201L);
        review.setFarmerId(401L);
        review.setRating(5);
        review.setReviewText("Excellent quality wheat crop!");
        review.setStatus(ReviewStatus.ACTIVE);

        orderDto = new OrderDto();
        orderDto.setId(101L);
        orderDto.setDealerId(201L);
        orderDto.setFarmerId(401L);
        orderDto.setCropId(301L);
        orderDto.setStatus("DELIVERED");
    }

    @Test
    void testCreateReviewSuccess() {
        FarmerReviewRequest request = new FarmerReviewRequest();
        request.setOrderId(101L);
        request.setCropId(301L);
        request.setDealerId(201L);
        request.setFarmerId(401L);
        request.setRating(5);
        request.setReviewText("Excellent quality wheat crop!");

        when(orderServiceClient.getOrderById(101L)).thenReturn(orderDto);
        when(reviewRepository.existsByDealerIdAndOrderIdAndStatusNot(201L, 101L, ReviewStatus.DELETED)).thenReturn(false);
        when(reviewRepository.save(any(FarmerReview.class))).thenAnswer(i -> {
            FarmerReview r = i.getArgument(0);
            r.setId(1L);
            return r;
        });

        FarmerReviewResponse response = reviewService.createReview(request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("ACTIVE", response.getStatus());
        verify(reviewRepository, times(1)).save(any(FarmerReview.class));
        verify(eventProducer, times(1)).publishReviewEvent(eq("REVIEW_CREATED"), any(), eq(401L), eq(101L), eq(5));
    }

    @Test
    void testCreateReviewRejectRatingZero() {
        FarmerReviewRequest request = new FarmerReviewRequest();
        request.setOrderId(101L);
        request.setCropId(301L);
        request.setDealerId(201L);
        request.setFarmerId(401L);
        request.setRating(0);
        request.setReviewText("Rating zero");

        assertThrows(InvalidReviewException.class, () -> reviewService.createReview(request));
        verify(reviewRepository, never()).save(any(FarmerReview.class));
    }

    @Test
    void testCreateReviewRejectRatingSix() {
        FarmerReviewRequest request = new FarmerReviewRequest();
        request.setOrderId(101L);
        request.setCropId(301L);
        request.setDealerId(201L);
        request.setFarmerId(401L);
        request.setRating(6);
        request.setReviewText("Rating six");

        assertThrows(InvalidReviewException.class, () -> reviewService.createReview(request));
        verify(reviewRepository, never()).save(any(FarmerReview.class));
    }

    @Test
    void testCreateReviewPreventDuplicate() {
        FarmerReviewRequest request = new FarmerReviewRequest();
        request.setOrderId(101L);
        request.setCropId(301L);
        request.setDealerId(201L);
        request.setFarmerId(401L);
        request.setRating(4);
        request.setReviewText("Duplicate review test");

        when(orderServiceClient.getOrderById(101L)).thenReturn(orderDto);
        when(reviewRepository.existsByDealerIdAndOrderIdAndStatusNot(201L, 101L, ReviewStatus.DELETED)).thenReturn(true);

        assertThrows(DuplicateReviewException.class, () -> reviewService.createReview(request));
        verify(reviewRepository, never()).save(any(FarmerReview.class));
    }

    @Test
    void testGetFarmerReviewsCalculatesAverage() {
        FarmerReview r2 = new FarmerReview();
        r2.setId(2L);
        r2.setFarmerId(401L);
        r2.setRating(4);
        r2.setStatus(ReviewStatus.ACTIVE);

        when(reviewRepository.findByFarmerIdAndStatusNot(401L, ReviewStatus.DELETED)).thenReturn(List.of(review, r2));

        FarmerRatingSummaryResponse summary = reviewService.getFarmerReviews(401L);

        assertNotNull(summary);
        assertEquals(401L, summary.getFarmerId());
        assertEquals(2, summary.getTotalReviews());
        assertEquals(4.5, summary.getAverageRating());
    }

    @Test
    void testUpdateReviewSuccess() {
        UpdateReviewRequest request = new UpdateReviewRequest();
        request.setRating(4);
        request.setReviewText("Updated review text");

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(FarmerReview.class))).thenAnswer(i -> i.getArgument(0));

        FarmerReviewResponse response = reviewService.updateReview(1L, request, 201L);

        assertNotNull(response);
        assertEquals(4, response.getRating());
        assertEquals("UPDATED", response.getStatus());
        verify(eventProducer, times(1)).publishReviewEvent(eq("REVIEW_UPDATED"), eq(1L), eq(401L), eq(101L), eq(4));
    }

    @Test
    void testUpdateReviewUnauthorizedWrongDealer() {
        UpdateReviewRequest request = new UpdateReviewRequest();
        request.setRating(4);
        request.setReviewText("Updated review text");

        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThrows(UnauthorizedReviewAccessException.class, () -> reviewService.updateReview(1L, request, 999L));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void testDeleteReviewUnauthorizedWrongDealer() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));

        assertThrows(UnauthorizedReviewAccessException.class, () -> reviewService.deleteReview(1L, 999L, "ROLE_DEALER"));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void testDeleteReviewAdminAllowed() {
        when(reviewRepository.findById(1L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(FarmerReview.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> reviewService.deleteReview(1L, 999L, "ROLE_ADMIN"));
        verify(reviewRepository, times(1)).save(any(FarmerReview.class));
    }
}