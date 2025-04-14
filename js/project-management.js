const projects = [];
let currentPage = 1;
const totalPerPage = 6;
let filteredProjects = [];
let projectIdToDelete = null;
let editingProjectId = null;

const modal = document.getElementById("project-modal");
const deleteModal = document.getElementById("delete-modal");
const closeButtons = document.querySelectorAll(".close-btn");
const cancelButtons = document.querySelectorAll(".cancel-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const openModalBtn = document.querySelector(".add-project-btn");
const projectForm = document.getElementById("project-form");
const projectNameInput = document.getElementById("project-name");
const projectDescriptionInput = document.getElementById("project-description");
const projectNameError = document.getElementById("project-name-error");
const projectDescriptionError = document.getElementById("project-description-error");
const searchInput = document.querySelector(".search-input");
const btnPagesElement = document.querySelector("#btnPages");
const btnPrevElement = document.querySelector("#btnPrev");
const btnNextElement = document.querySelector("#btnNext");

document.addEventListener("DOMContentLoaded", function () {
  setupModalEvents();
  setupProjectForm();
  setupSearch();
  setupPagination();
  renderProjects(currentPage);
});

// Đóng/Mở modal
function setupModalEvents() {
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal")));
  });

  cancelButtons.forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal")));
  });

  openModalBtn.addEventListener("click", openProjectModal);
}

// Xử lý form dự án
function setupProjectForm() {
  projectForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = projectNameInput.value.trim();
    const desc = projectDescriptionInput.value.trim();
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!validateProject(name, desc, projects, editingProjectId)) return;

    if (editingProjectId) {
      const project = projects.find((p) => p.id === editingProjectId);
      project.name = name;
      project.description = desc;
    } else {
      const newId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
      projects.unshift({ id: newId, name, description: desc, ownerId: loggedInUser.id });
    }

    localStorage.setItem("projects", JSON.stringify(projects));
    closeModal(modal);
    location.reload();
  });

  document.querySelector("tbody").addEventListener("click", function (e) {
    const target = e.target;
    const id = parseInt(target.dataset.id, 10);

    if (target.classList.contains("delete-btn")) {
      projectIdToDelete = id;
      deleteModal.style.display = "block";
    }

    if (target.classList.contains("edit-btn")) {
      const projects = JSON.parse(localStorage.getItem("projects")) || [];
      const project = projects.find((p) => p.id === id);
      if (!project) return;

      editingProjectId = id;
      projectNameInput.value = project.name;
      projectDescriptionInput.value = project.description;
      openProjectModal();
    }
  });

  confirmDeleteBtn.addEventListener("click", function () {
    if (!projectIdToDelete) return;
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const updated = projects.filter((p) => p.id !== projectIdToDelete);
    localStorage.setItem("projects", JSON.stringify(updated));
    closeModal(deleteModal);
    location.reload(); 
  });
}

// Tìm kiếm dự án
function setupSearch() {
  searchInput.addEventListener("input", function () {
    const term = searchInput.value.toLowerCase();
    const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || {};

    filteredProjects = allProjects.filter(
      (p) => p.ownerId === loggedInUser.id && p.name.toLowerCase().includes(term)
    );

    currentPage = 1; // Reset về trang đầu tiên
    renderProjects(currentPage);
  });
}

// Xử lý phân trang
function setupPagination() {
  btnNextElement.addEventListener("click", function () {
    const totalPage = Math.ceil(filteredProjects.length / totalPerPage);
    if (currentPage < totalPage) {
      currentPage++;
      renderProjects(currentPage);
    }
  });

  btnPrevElement.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      renderProjects(currentPage);
    }
  });
}

// Hiển thị danh sách dự án
function renderProjects(page = 1) {
  const allProjects = JSON.parse(localStorage.getItem("projects")) || [];
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) return;

  const userProjects = allProjects.filter((p) => p.ownerId === loggedInUser.id);
  filteredProjects = filteredProjects.length > 0 ? filteredProjects : userProjects;

  const start = (page - 1) * totalPerPage;
  const end = start + totalPerPage;
  const paginatedProjects = filteredProjects.slice(start, end);

  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  if (paginatedProjects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">Không có dự án nào để hiển thị.</td></tr>`;
    return;
  }

  paginatedProjects.forEach((project) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${project.id}</td>
      <td>${project.name}</td>
      <td>
        <button class="edit-btn" data-id="${project.id}">Sửa</button>
        <button class="delete-btn" data-id="${project.id}">Xóa</button>
        <a href="../pages/project-details.html?projectName=${encodeURIComponent(project.name)}"><button class="detail-btn">Chi tiết</button></a>
      </td>
    `;
    tbody.appendChild(row);
  });

  renderPagination(filteredProjects.length, page);
}

// Hiển thị phân trang
function renderPagination(totalItems, currentPage) {
  const totalPage = Math.ceil(totalItems / totalPerPage);
  btnPagesElement.textContent = "";

  for (let i = 1; i <= totalPage; i++) {
    const btnElement = document.createElement("button");
    btnElement.textContent = i;

    if (currentPage === i) {
      btnElement.classList.add("active");
    }

    btnElement.addEventListener("click", function () {
      currentPage = i;
      renderProjects(currentPage);
    });

    btnPagesElement.appendChild(btnElement);
  }

  // Disable nút "Trước" và "Tiếp" khi cần
  btnPrevElement.disabled = currentPage === 1;
  btnNextElement.disabled = currentPage === totalPage;
}

// Đóng modal
function closeModal(modal) {
  modal.style.display = "none";
  if (modal === deleteModal) projectIdToDelete = null;
  projectForm.reset();
  clearErrors();
}

// Mở modal
function openProjectModal() {
  modal.style.display = "block";
}

// Xóa lỗi
function clearErrors() {
  projectNameError.textContent = "";
  projectDescriptionError.textContent = "";
  projectNameInput.classList.remove("input-error");
  projectDescriptionInput.classList.remove("input-error");
}

// Kiểm tra tính hợp lệ của dự án
function validateProject(name, desc, projects, editingId = null) {
  let valid = true;
  clearErrors();

  if (!name) {
    projectNameError.textContent = "Tên dự án không được để trống.";
    projectNameInput.classList.add("input-error");
    valid = false;
  } else if (name.length < 5 || name.length > 50) {
    projectNameError.textContent = "Tên dự án phải từ 5 đến 50 ký tự.";
    projectNameInput.classList.add("input-error");
    valid = false;
  } else if (projects.some((p) => p.name === name && p.id !== editingId)) {
    projectNameError.textContent = "Tên dự án đã tồn tại.";
    projectNameInput.classList.add("input-error");
    valid = false;
  }

  if (!desc) {
    projectDescriptionError.textContent = "Mô tả dự án không được để trống.";
    projectDescriptionInput.classList.add("input-error");
    valid = false;
  } else if (desc.length < 10 || desc.length > 200) {
    projectDescriptionError.textContent = "Mô tả dự án phải từ 10 đến 200 ký tự.";
    projectDescriptionInput.classList.add("input-error");
    valid = false;
  }

  return valid;
}