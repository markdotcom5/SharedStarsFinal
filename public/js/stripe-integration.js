// /js/stripe-integration.js

// Initialize Stripe using your publishable key (from your environment or replace with your key)
const stripe = Stripe(process.env.STRIPE_API_KEY || 'placeholder_key');

// Initialize Stripe Elements
const elements = stripe.elements();
const card = elements.create('card', {
  style: {
    base: {
      color: '#FFFFFF',
      fontFamily: '"Inter", sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#6B7280', // Placeholder text color
      },
    },
  },
});

// Mount the card input field into the DOM element with id "card-element"
card.mount('#card-element');

// Handle card input validation and display errors if any
card.on('change', ({ error }) => {
  const displayError = document.getElementById('card-errors');
  if (error) {
    displayError.textContent = error.message;
  } else {
    displayError.textContent = '';
  }
});

/**
 * Function to update the personalized countdown timeline.
 * This function should update the countdown based on the plan type.
 * (You may customize the implementation as needed.)
 */
function updatePersonalCountdown(planType) {
  // Example: update some DOM elements based on plan type
  console.log(`Updating personalized countdown for plan: ${planType}`);
  // You might fetch new timing values from your backend API,
  // then update the innerText of elements with IDs like "personalYears", "personalMonths", etc.
  // For now, we simulate by setting some dummy values:
  document.getElementById('personalYears').textContent = "2022";
  document.getElementById('personalMonths').textContent = "6";
  document.getElementById('personalWeeks').textContent = "2";
  document.getElementById('personalDays').textContent = "14";
  document.getElementById('personalHours').textContent = "12";
  document.getElementById('personalMinutes').textContent = "30";
}

/**
 * Async event listener for plan selection buttons.
 * When a plan button is clicked, it creates a payment method and then attempts to create and confirm a subscription.
 */
document.querySelectorAll('[data-plan]').forEach(button => {
  button.addEventListener('click', async (e) => {
    e.preventDefault();

    const planType = button.getAttribute('data-plan');
    const loadingElement = document.getElementById('payment-processing'); // Spinner element
    const cardErrors = document.getElementById('card-errors');

    try {
      // Show loading spinner and disable the button
      loadingElement.classList.remove('hidden');
      button.disabled = true;

      // Create a payment method using the card input
      const { paymentMethod, error: paymentError } = await stripe.createPaymentMethod({
        type: 'card',
        card: card,
      });
      if (paymentError) {
        throw paymentError;
      }

      // Send the payment method and selected plan type to your backend to create the subscription
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          plan: planType,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create subscription. Please try again.');
      }
      const { clientSecret } = await response.json();

      // Confirm the payment with the client secret from your backend
      const { error: confirmationError } = await stripe.confirmCardPayment(clientSecret);
      if (confirmationError) {
        throw confirmationError;
      }

      // Update personalized countdown timeline
      updatePersonalCountdown(planType);

      // Show success modal (ensure the modal element exists in your DOM)
      const successModal = document.getElementById('success-modal');
      if (successModal && typeof successModal.showModal === 'function') {
        successModal.showModal();
      } else {
        console.log('Subscription successful, but no success modal found.');
      }
    } catch (error) {
      // Display error to the user
      cardErrors.textContent = error.message || 'An error occurred. Please try again.';
      console.error('Subscription Error:', error);
    } finally {
      // Hide the loading spinner and re-enable the button
      loadingElement.classList.add('hidden');
      button.disabled = false;
    }
  });
});
