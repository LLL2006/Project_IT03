document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailError.textContent = "";
    passwordError.textContent = "";

    let isValid = true;

    if (!emailInput.value.trim()) {
      emailError.textContent = "Email không được để trống.";
      isValid = false;
    }

    if (!passwordInput.value.trim()) {
      passwordError.textContent = "Mật khẩu không được để trống.";
      isValid = false;
    }

    if (isValid) {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      if (users.length === 0) {
        emailError.textContent = "Không có tài khoản nào được đăng ký.";
        return;
      }

      const user = users.find(
        (u) =>
          u.email === emailInput.value.trim() &&
          u.password === passwordInput.value.trim()
      );

      if (user) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        // Chuyển hướng đến trang quản lý dự án
        window.location.href = "../pages/project-management.html";
      } else {
        emailError.textContent = "Email hoặc mật khẩu không đúng.";
      }
    }
  });
});
