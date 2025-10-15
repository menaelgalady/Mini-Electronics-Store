document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("productList");
  const addProductForm = document.getElementById("addProductForm");
  const addProductModalEl = document.getElementById("addProductModal");
  const addProductModal = addProductModalEl ? new bootstrap.Modal(addProductModalEl) : null;
  const cartBtn = document.getElementById("cart-btn");
  const cartCount = document.getElementById("cart-count");
  const checkoutModalEl = document.getElementById("checkoutModal");
  const checkoutModal = checkoutModalEl ? new bootstrap.Modal(checkoutModalEl) : null;
  const promoForm = document.getElementById("promo-form");
  const finalCheckout = document.getElementById("final-checkout");

  let cart = [];
  try {
    const stored = localStorage.getItem("cart");
    cart = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(cart)) cart = [];
  } catch {
    cart = [];
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function sanitizePrice(p) {
    if (typeof p === "number") return p;
    if (!p) return 0;
    const cleaned = String(p).replace(/[^0-9.\-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function updateCartCount() {
    const totalQuantity = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
    if (cartCount) {
      cartCount.textContent = totalQuantity;
      cartCount.style.display = totalQuantity > 0 ? "inline-block" : "none";
    }
  }

  function addToCart(productName, productPrice, productImg) {
    const priceNum = sanitizePrice(productPrice);
    const existingItem = cart.find(item => item.name === productName);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + 1;
      existingItem.price = priceNum;
    } else {
      cart.push({
        name: productName,
        price: priceNum,
        img: productImg || "",
        quantity: 1
      });
    }
    saveCart();
    updateCartCount();
    alert(`${productName} has been added to your cart successfully!`);
  }

  function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    saveCart();
    updateCartCount();
  }

  function calculateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
    const shipping = cart.length > 0 ? 10.0 : 0;
    const tax = subtotal * 0.12;
    const discountEl = document.getElementById("discount");
    let discount = 0;
    if (discountEl) {
      const curr = parseFloat((discountEl.textContent || "").replace(/[^0-9.\-]/g, ""));
      if (!isNaN(curr) && curr > 0) discount = curr;
    }
    const total = subtotal + shipping + tax - discount;

    document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById("shipping-fee").textContent = `$${shipping.toFixed(2)}`;
    document.getElementById("tax").textContent = `$${tax.toFixed(2)}`;
    document.getElementById("total-price").textContent = `$${total.toFixed(2)}`;
  }

  function fillCheckoutForm() {
    if (!checkoutModalEl) return;
    if (cart.length === 0) {
      alert("Your cart is empty! Please add some products first.");
      return;
    }

    const cartItemsContainer = document.getElementById("cart-items");
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = "";
      cart.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "d-flex align-items-center mb-2 border-bottom pb-2 justify-content-between";
        itemDiv.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${item.img || 'https://via.placeholder.com/50'}" alt="${item.name}" width="50" class="me-2 rounded">
            <div>
              <strong>${item.name}</strong><br>
              <small>$${(item.price || 0).toFixed(2)} × ${item.quantity || 0}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="text-end">$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
            <button class="btn btn-sm btn-outline-danger remove-from-modal" data-name="${item.name}">🗑️</button>
          </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
      });
    }

    calculateTotals();
  }

  if (!window.__cartListenersAdded) {
    window.__cartListenersAdded = true;

    if (productList) {
      productList.addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;

        if (target.classList.contains("remove-btn")) {
          const card = target.closest(".product-card");
          if (card) {
            const productName = card.querySelector(".card-title")?.textContent.trim();
            removeFromCart(productName);
            const col = card.parentElement;
            col.style.opacity = "0";
            col.style.transform = "translateY(12px) scale(0.98)";
            setTimeout(() => col.remove(), 300);
          }
          return;
        }

        if (target.classList.contains("add-to-cart-btn")) {
          const btn = target;
          let productName = btn.getAttribute("data-name") || btn.closest(".product-card")?.querySelector(".card-title")?.textContent.trim() || "Product";
          let productPrice = sanitizePrice(btn.getAttribute("data-price") || btn.closest(".product-card")?.querySelector(".price")?.textContent || 0);
          let productImg = btn.getAttribute("data-img") || btn.closest(".product-card")?.querySelector(".card-img-top")?.getAttribute("src") || "";

          addToCart(productName, productPrice, productImg);
        }
      });
    }

    if (cartBtn && checkoutModal) {
      cartBtn.addEventListener("click", () => {
        fillCheckoutForm();
        checkoutModal.show();
      });
    }

    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-from-modal");
      if (!btn) return;
      const name = btn.getAttribute("data-name");
      removeFromCart(name);
      fillCheckoutForm();
      if (cart.length === 0 && checkoutModal) {
        checkoutModal.hide();
        alert("Your cart is now empty!");
      }
    });

    if (promoForm) {
      promoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const promoInput = document.getElementById("promo-code");
        const promoCode = promoInput ? String(promoInput.value).trim().toUpperCase() : "";
        const subtotal = sanitizePrice(document.getElementById("subtotal").textContent);
        const shipping = 10.00;
        const tax = subtotal * 0.12;
        let discount = 0;
        let message = "";

        if (promoCode === "DISCOUNT10") {
          discount = subtotal * 0.10;
          message = "10% discount applied successfully! 💰";
        } else {
          message = "Invalid promo code. Try 'DISCOUNT10'.";
        }

        document.getElementById("discount").textContent = `$${discount.toFixed(2)}`;
        const total = subtotal + shipping + tax - discount;
        document.getElementById("total-price").textContent = `$${total.toFixed(2)}`;

        const promoMessage = document.getElementById("promo-message");
        if (promoMessage) {
          promoMessage.style.display = "block";
          promoMessage.textContent = message;
          promoMessage.className = discount > 0 ? "text-success small mt-1" : "text-danger small mt-1";
        }
      });
    }

    if (finalCheckout) {
      finalCheckout.addEventListener("click", () => {
        const totalEl = document.getElementById("total-price");
        const total = totalEl ? sanitizePrice(totalEl.textContent) : 0;
        if (total > 0) {
          alert(`Thank you! Your order has been placed successfully. Total: $${total.toFixed(2)}`);
          cart = [];
          saveCart();
          updateCartCount();
          checkoutModal?.hide();
        } else {
          alert("Your cart is empty! Please add some products first.");
        }
      });
    }

    if (addProductForm) {
      addProductForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameEl = document.getElementById("productName");
        const priceEl = document.getElementById("productPrice");
        const imageEl = document.getElementById("productImage");
        const name = nameEl?.value.trim();
        const priceInput = priceEl?.value;
        const imageUrl = imageEl?.value.trim();

        if (!name || !priceInput || !imageUrl) {
          alert("Please fill all fields correctly.");
          return;
        }

        const price = sanitizePrice(priceInput).toFixed(2);

        const colDiv = document.createElement("div");
        colDiv.className = "col-12 col-sm-6 col-md-4";
        colDiv.innerHTML = `
          <div class="card product-card h-100 shadow-sm">
            <img src="${imageUrl}" class="card-img-top" alt="${name}" />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${name}</h5>
              <p class="price mb-3">$${price}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <button class="btn btn-success btn-sm add-to-cart-btn" data-name="${name}" data-price="${price}" data-img="${imageUrl}">Add to Cart</button>
                <button class="btn btn-danger btn-sm remove-btn">Remove</button>
              </div>
            </div>
          </div>
        `;
        productList?.appendChild(colDiv);
        addProductModal?.hide();
        addProductForm.reset();
        alert(`${name} added successfully!`);
      });
    }
  }

  updateCartCount();
});
