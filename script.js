document.addEventListener("DOMContentLoaded", () => {
  function showAlert(message, type = "success", timeout = 3000) {
    const container = document.getElementById("alert-container");
    if (!container) {
      try { alert(message); } catch (e) { /* silent */ }
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    container.appendChild(wrapper);

    setTimeout(() => {
      const alertEl = wrapper.querySelector('.alert');
      if (alertEl) {
        try {
          const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
          bsAlert.close();
        } catch (e) { /* silent */ }
      }
    }, timeout);
  }

  const productList = document.getElementById("productList");
  const addProductForm = document.getElementById("addProductForm");
  const addProductModalEl = document.getElementById("addProductModal");
  let addProductModal = null;
  try { if (addProductModalEl) addProductModal = new bootstrap.Modal(addProductModalEl); } catch (e) { addProductModal = null; }

  const cartBtn = document.getElementById("cart-btn");
  const cartCount = document.getElementById("cart-count");

  const checkoutModalEl = document.getElementById("checkoutModal");
  let checkoutModal = null;
  try { if (checkoutModalEl) checkoutModal = new bootstrap.Modal(checkoutModalEl); } catch (e) { checkoutModal = null; }

  const promoForm = document.getElementById("promo-form");
  const finalCheckout = document.getElementById("final-checkout");

 
  let cart = [];
  (function loadCart() {
    try {
      const stored = localStorage.getItem("cart");
      cart = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }
  })();

  function saveCart() {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch { /* silent */ }
  }

  function sanitizePrice(p) {
    if (typeof p === "number") return p;
    if (!p) return 0;
    const cleaned = String(p).replace(/[^0-9.\-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function findItemIndexByName(name) {
    return cart.findIndex(i => String(i.name || "").trim() === String(name || "").trim());
  }

  function updateCartCount() {
    const totalQuantity = cart.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    if (cartCount) {
      cartCount.textContent = totalQuantity;
      cartCount.style.display = totalQuantity > 0 ? "inline-block" : "none";
    }
  }

  function addToCart(productName, productPrice, productImg) {
    const name = String(productName || "Product").trim();
    const price = sanitizePrice(productPrice);
    const idx = findItemIndexByName(name);

    if (idx > -1) {
      cart[idx].quantity = (Number(cart[idx].quantity) || 0) + 1;
      cart[idx].price = price;
    } else {
      cart.push({
        name,
        price,
        img: productImg || "",
        quantity: 1
      });
    }
    saveCart();
    updateCartCount();
    showAlert(`${name} has been added to your cart successfully!`, "success");
  }

  function removeFromCart(productName) {
    const name = String(productName || "").trim();
    cart = cart.filter(item => String(item.name || "").trim() !== name);
    saveCart();
    updateCartCount();
    showAlert(`${name} removed from cart.`, "info");
  }

  function changeQuantity(productName, newQty) {
    const idx = findItemIndexByName(productName);
    if (idx === -1) return;
    const q = Math.max(0, Math.floor(Number(newQty) || 0));
    if (q === 0) {
      const removedName = cart[idx].name;
      cart.splice(idx, 1);
      showAlert(`${removedName} removed from cart.`, "info");
    } else {
      cart[idx].quantity = q;
      showAlert(`Quantity for ${productName} updated.`, "success");
    }
    saveCart();
    updateCartCount();
  }

  function calculateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
    const shipping = cart.length > 0 ? 10.00 : 0.00;
    const tax = subtotal * 0.12;
    let discount = 0;
    const discountEl = document.getElementById("discount");
    if (discountEl) {
      const txt = String(discountEl.textContent || "").replace(/[^0-9.\-]/g, "");
      const d = parseFloat(txt);
      if (!isNaN(d) && d > 0) discount = d;
    }
    const total = subtotal + shipping + tax - discount;

    const elSubtotal = document.getElementById("subtotal");
    const elShipping = document.getElementById("shipping-fee");
    const elTax = document.getElementById("tax");
    const elTotal = document.getElementById("total-price");

    if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (elShipping) elShipping.textContent = `$${shipping.toFixed(2)}`;
    if (elTax) elTax.textContent = `$${tax.toFixed(2)}`;
    if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
    return { subtotal, shipping, tax, discount, total };
  }

  function fillCheckoutForm() {
    if (!checkoutModalEl) {
      showAlert("Checkout modal element is missing from the page.", "danger");
      return false;
    }
    if (cart.length === 0) {
      showAlert("Your cart is empty! Please add some products first.", "warning");
      return false;
    }

    const cartItemsContainer = document.getElementById("cart-items");
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = "";
      cart.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "d-flex align-items-center mb-2 border-bottom pb-2 justify-content-between";

        itemDiv.innerHTML = `
          <div class="d-flex align-items-center">
            <img src="${item.img || 'https://via.placeholder.com/50'}" alt="${escapeHtml(item.name)}" width="50" class="me-2 rounded">
            <div>
              <strong>${escapeHtml(item.name)}</strong><br>
              <small>$${(Number(item.price) || 0).toFixed(2)} × <span class="item-qty">${Number(item.quantity) || 0}</span></small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <div class="text-end">$${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}</div>
            <div class="d-flex gap-1 align-items-center">
              <button class="btn btn-sm btn-outline-secondary btn-decrease" data-name="${escapeAttribute(item.name)}">-</button>
              <button class="btn btn-sm btn-outline-danger remove-from-modal" data-name="${escapeAttribute(item.name)}">🗑️</button>
              <button class="btn btn-sm btn-outline-secondary btn-increase" data-name="${escapeAttribute(item.name)}">+</button>
            </div>
          </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
      });
    }

    calculateTotals();
    return true;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function escapeAttribute(str) {
    return String(str || "").replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  if (!window.__cartListenersAdded) {
    window.__cartListenersAdded = true;

    if (productList) {
      productList.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        if (btn.classList.contains("remove-btn")) {
          const card = btn.closest(".product-card");
          if (card) {
            const productName = card.querySelector(".card-title")?.textContent?.trim();
            const col = card.parentElement;
            if (col) {
              col.style.transition = "all 0.25s ease";
              col.style.opacity = "0";
              col.style.transform = "translateY(12px) scale(0.98)";
              setTimeout(() => {
                col.remove();
                if (productName) removeFromCart(productName);
              }, 250);
            } else {
              if (productName) removeFromCart(productName);
            }
          }
          return;
        }

        if (btn.classList.contains("add-to-cart-btn")) {
          let productName = btn.getAttribute("data-name") || btn.closest(".product-card")?.querySelector(".card-title")?.textContent?.trim() || "Product";
          let productPrice = btn.getAttribute("data-price") || btn.closest(".product-card")?.querySelector(".price")?.textContent || 0;
          let productImg = btn.getAttribute("data-img") || btn.closest(".product-card")?.querySelector(".card-img-top")?.getAttribute("src") || "";
          productPrice = sanitizePrice(productPrice);
          addToCart(productName, productPrice, productImg);
        }
      });
    }

    if (cartBtn && checkoutModal) {
      cartBtn.addEventListener("click", () => {
        const ok = fillCheckoutForm();
        if (ok) {
          try { checkoutModal.show(); } catch (e) { showAlert("Unable to show checkout modal.", "danger"); }
        }
      });
    } else if (cartBtn && !checkoutModal) {
      cartBtn.addEventListener("click", () => {
        showAlert("Checkout modal not found on the page. Please ensure an element with id='checkoutModal' exists.", "danger");
      });
    }

    document.body.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove-from-modal");
      if (removeBtn) {
        const name = removeBtn.getAttribute("data-name");
        if (name) removeFromCart(name);
        fillCheckoutForm();
        if (cart.length === 0 && checkoutModal) {
          try { checkoutModal.hide(); } catch (err) { /* silent */ }
          showAlert("Your cart is now empty!", "info");
        }
        return;
      }

      const incBtn = e.target.closest(".btn-increase");
      if (incBtn) {
        const name = incBtn.getAttribute("data-name");
        const idx = findItemIndexByName(name);
        if (idx > -1) {
          changeQuantity(name, (Number(cart[idx].quantity) || 0) + 1);
          fillCheckoutForm();
        }
        return;
      }

      const decBtn = e.target.closest(".btn-decrease");
      if (decBtn) {
        const name = decBtn.getAttribute("data-name");
        const idx = findItemIndexByName(name);
        if (idx > -1) {
          changeQuantity(name, (Number(cart[idx].quantity) || 0) - 1);
          fillCheckoutForm();
          if (cart.length === 0 && checkoutModal) {
            try { checkoutModal.hide(); } catch (err) { /* silent */ }
            showAlert("Your cart is now empty!", "info");
          }
        }
        return;
      }
    });

    if (promoForm) {
      promoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const promoInput = document.getElementById("promo-code");
        const promoCode = promoInput ? String(promoInput.value).trim().toUpperCase() : "";
        const totals = calculateTotals();
        let discount = 0;
        let message = "";

        if (promoCode === "DISCOUNT10") {
          discount = totals.subtotal * 0.10;
          message = "10% discount applied successfully! 💰";
        } else {
          message = "Invalid promo code. Try 'DISCOUNT10'.";
        }

        const discountEl = document.getElementById("discount");
        if (discountEl) discountEl.textContent = `$${discount.toFixed(2)}`;

        calculateTotals();

        const promoMessage = document.getElementById("promo-message");
        if (promoMessage) {
          promoMessage.style.display = "block";
          promoMessage.textContent = message;
          promoMessage.className = discount > 0 ? "text-success small mt-1" : "text-danger small mt-1";
        }

        showAlert(message, discount > 0 ? "success" : "warning");
      });
    }

    if (finalCheckout) {
      finalCheckout.addEventListener("click", () => {
        const totalEl = document.getElementById("total-price");
        const total = totalEl ? sanitizePrice(totalEl.textContent) : 0;
        if (total > 0) {
          showAlert(`Thank you! Your order has been placed successfully. Total: $${total.toFixed(2)}`, "info");
          cart = [];
          saveCart();
          updateCartCount();
          try { checkoutModal?.hide(); } catch (e) { /* silent */ }
        } else {
          showAlert("Your cart is empty! Please add some products first.", "warning");
        }
      });
    }

    if (addProductForm) {
      addProductForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameEl = document.getElementById("productName");
        const priceEl = document.getElementById("productPrice");
        const imageEl = document.getElementById("productImage");
        const name = nameEl?.value?.trim();
        const priceInput = priceEl?.value;
        const imageUrl = imageEl?.value?.trim();

        if (!name || !priceInput || !imageUrl) {
          showAlert("Please fill all fields correctly.", "danger");
          return;
        }

        const price = sanitizePrice(priceInput).toFixed(2);

        const colDiv = document.createElement("div");
        colDiv.className = "col-12 col-sm-6 col-md-4";
        colDiv.innerHTML = `
          <div class="card product-card h-100 shadow-sm">
            <img src="${escapeAttribute(imageUrl)}" class="card-img-top" alt="${escapeAttribute(name)}" />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${escapeHtml(name)}</h5>
              <p class="price mb-3">$${price}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <button class="btn btn-success btn-sm add-to-cart-btn" data-name="${escapeAttribute(name)}" data-price="${price}" data-img="${escapeAttribute(imageUrl)}">Add to Cart</button>
                <button class="btn btn-danger btn-sm remove-btn">Remove</button>
              </div>
            </div>
          </div>
        `;
        productList?.appendChild(colDiv);
        addProductModal?.hide();
        addProductForm.reset();
        showAlert(`${name} added successfully!`, "success");
      });
    }
  } 

  updateCartCount();
  try { calculateTotals(); } catch (e) { /* silent */ }
});
