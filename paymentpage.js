document.addEventListener('DOMContentLoaded', () => {
    // Get device hash from URL
    const urlParams = new URLSearchParams(window.location.search);
    const deviceHash = urlParams.get('deviceHash');
  
    if (!deviceHash) {
      alert('Invalid access. Please go back to the extension and try again.');
      return;
    }
  
    // Initialize Stripe
    const stripe = Stripe('pk_test_51PsSyHIWrSS6cEi1aZ1ckybXkbzmbF9jQeEtEIzAPGAmiIFjracScUTgRuqUvm1WGAnKQcgzccRCdP6kGr1o46mM00U571Gshx');
    const elements = stripe.elements();
  
    // Create card element
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
  
    // Handle validation errors
    cardElement.on('change', ({ error, complete }) => {
      const displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
  
      // Enable submit button if card is complete
      document.getElementById('submit-button').disabled = !complete;
    });
  
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      setLoading(true);
  
      const email = document.getElementById('email').value;
  
      try {
        // Create payment method
        const result = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            email: email,
          },
        });
  
        if (result.error) {
          // Show error
          const errorElement = document.getElementById('card-errors');
          errorElement.textContent = result.error.message;
          setLoading(false);
          return;
        }
  
        // Send payment method ID to server
        const response = await fetch('https://luisgcastro.com/.netlify/functions/processPayment/processPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: result.paymentMethod.id,
            email: email,
            deviceHash: deviceHash,
          }),
        });
  
        const paymentData = await response.json();
  
        if (!response.ok) {
          throw new Error(paymentData.error || 'Payment processing failed');
        }
  
        if (paymentData.requiresAction) {
          // Handle 3D Secure or other actions
          const { error: confirmError } = await stripe.confirmCardPayment(paymentData.clientSecret);
          if (confirmError) {
            throw new Error(confirmError.message);
          }
          // If successful, Stripe will redirect to the return_url (success.html) automatically
        } else if (paymentData.success) {
          // Payment succeeded immediately, redirect to success page
          window.location.href = 'https://luisgcastro.com/success.html';
        } else {
          throw new Error(paymentData.error || 'Unexpected response from server');
        }
      } catch (error) {
        console.error('Payment error:', error);
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message || 'An unexpected error occurred';
        setLoading(false);
      }
    });
  
    function setLoading(isLoading) {
      const submitButton = document.getElementById('submit-button');
      const buttonText = document.getElementById('button-text');
      const spinner = document.getElementById('spinner');
  
      if (isLoading) {
        submitButton.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
      } else {
        submitButton.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    }
  });