document.addEventListener("DOMContentLoaded", function () {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn || isLoggedIn !== "true") {
    window.location.href = "../pages/login.html";
  }

  // Nếu đã đăng nhập, ngăn truy cập login hoặc register
  if (isLoggedIn === "true") {
    if (window.location.href.includes("login.html") || window.location.href.includes("register.html")) {
      window.location.href = "../pages/project-management.html"; // Chuyển hướng đến trang chính
    }
  }
});
