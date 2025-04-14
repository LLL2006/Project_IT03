document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("register-form");
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  const fullNameError = document.getElementById("full-name-error");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const confirmPasswordError = document.getElementById(
    "confirm-password-error"
  );


  
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    fullNameError.textContent = "";
    emailError.textContent = "";
    passwordError.textContent = "";
    confirmPasswordError.textContent = "";

    let isValid = true;

    if (!fullNameInput.value.trim()) {
      fullNameError.textContent = "Họ và tên không được để trống";
      isValid = false;
    }

    if (!emailInput.value.trim()) {
      emailError.textContent = "Email không được để trống";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
      emailError.textContent = "Email không đúng định dạng";
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      passwordError.textContent = "Mật khẩu không được để trống";
      isValid = false;
    } else if (passwordInput.value.length < 8) {
      passwordError.textContent = "Mật khẩu phải có tối thiểu 8 ký tự";
      isValid = false;
    }

    if (!confirmPasswordInput.value.trim()) {
      confirmPasswordError.textContent =
        "Mật khẩu xác nhận không được để trống";
      isValid = false;
    } else if (confirmPasswordInput.value !== passwordInput.value) {
      confirmPasswordError.textContent =
        "Mật khẩu xác nhận phải trùng với mật khẩu";
      isValid = false;
    }

    if (isValid) {
      const users = JSON.parse(localStorage.getItem("users")) || [];

      const isEmailExist = users.some(
        (user) => user.email === emailInput.value.trim()
      );
      if (isEmailExist) {
        emailError.textContent = "Email đã được sử dụng";
        return;
      }

      // Tự động tăng ID
      const newId = users.length > 0 ? users[users.length - 1].id + 1 : 1;

      const newUser = {
        id: newId, 
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      localStorage.setItem("loggedInUser", JSON.stringify(newUser));
      localStorage.setItem("isLoggedIn", "true");

      window.location.href = "../pages/project-management.html";
    }
  });
});
