document.addEventListener("DOMContentLoaded", () => {
  const reviewsList = document.getElementById("reviews-list");
  const writeReviewButton = document.getElementById("write-review");
  const quickviewModal = document.getElementById("quickview-modal");
  const submitReviewButton = quickviewModal.querySelector(".rev-button");
  const skipButton = quickviewModal.querySelector(".skip");
  const backButton = quickviewModal.querySelector(".back");

  // Fetch and display reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch("/.netlify/functions/reviews");
      const reviews = await response.json();
      reviewsList.innerHTML = reviews
        .map(
          (review) => `
            <div class="review-card">
              <div class="review-details">
                <div class="author-name">${review.name}</div>
                <div class="date">${new Date(
                  review.date
                ).toLocaleDateString()}</div>
                <div class="tydal-star-wrapper">
                  ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
                </div>
                <div class="review-text">${review.comment}</div>
              </div>
            </div>
          `
        )
        .join("");
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  // Show modal
  writeReviewButton.addEventListener("click", () => {
    quickviewModal.style.display = "block";
  });

  // Hide modal
  const hideModal = () => {
    quickviewModal.style.display = "none";
  };

  skipButton.addEventListener("click", hideModal);
  backButton.addEventListener("click", hideModal);

  // Submit new review
  submitReviewButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const nameInput = quickviewModal.querySelector(
      'input[placeholder="Your Name"]'
    );
    const commentTextarea = quickviewModal.querySelector(".rev-textarea");
    const ratingInputs = quickviewModal.querySelectorAll(
      '.review-star-container input[type="radio"]'
    );

    const name = nameInput.value;
    const comment = commentTextarea.value;
    const rating =
      Array.from(ratingInputs).find((input) => input.checked)?.value || "5";

    const reviewData = { name, comment, rating };

    try {
      const response = await fetch("/.netlify/functions/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      if (response.ok) {
        nameInput.value = "";
        commentTextarea.value = "";
        ratingInputs.forEach((input) => (input.checked = false));
        hideModal();
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
