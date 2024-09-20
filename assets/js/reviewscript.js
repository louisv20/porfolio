document.addEventListener("DOMContentLoaded", () => {
  const reviewsList = document.getElementById("reviews-list");
  const reviewForm = document.getElementById("review-form");

  // Fetch and display reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch("/.netlify/functions/reviews");
      const reviews = await response.json();
      reviewsList.innerHTML = reviews
        .map(
          (review) => `
          <div class="review-item">
            <h4>${review.name}</h4>
            <div class="rating">${"★".repeat(review.rating)}${"☆".repeat(
            5 - review.rating
          )}</div>
            <p>${review.comment}</p>
            <small>${new Date(review.date).toLocaleDateString()}</small>
          </div>
        `
        )
        .join("");
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // Submit new review
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(reviewForm);
    const reviewData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/.netlify/functions/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      if (response.ok) {
        reviewForm.reset();
        fetchReviews();
      } else {
        console.error("Error submitting review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  });

  // Initial fetch of reviews
  fetchReviews();
});
