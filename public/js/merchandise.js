document.addEventListener('DOMContentLoaded', () => {
    const products = [
        { id: 1, name: "StelTrek Hoodie", price: "$49.99", image: "/images/hoodie.jpg" },
        { id: 2, name: "StelTrek Cap", price: "$19.99", image: "/images/cap.jpg" },
        { id: 3, name: "StelTrek T-Shirt", price: "$29.99", image: "/images/tshirt.jpg" },
        { id: 4, name: "StelTrek Space Jacket", price: "$199.99", image: "/images/jacket.jpg" }
    ];

    const productGrid = document.querySelector('.product-grid');

    // Dynamically populate products
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">${product.price}</p>
            <button class="buy-button" data-id="${product.id}">Buy Now</button>
        `;
        productGrid.appendChild(productCard);
    });

    // Handle Buy Now button clicks
    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.dataset.id;
            alert(`Product ${productId} added to cart!`);
        });
    });
});
