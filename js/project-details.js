let members = JSON.parse(localStorage.getItem("members")) || [];
let taskNameInput;
let taskAssigneeSelect;
let taskStatusSelect;
let taskStartDateInput;
let taskEndDateInput;
let taskPrioritySelect;
let taskProgressSelect;
const deleteModal = document.getElementById("delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const closeDeleteModalBtn = deleteModal.querySelector(".close-btn");
let taskToDelete = null;
const taskForm = document.getElementById("task-form");
let editingTaskId = null;
const taskNameError = document.getElementById("task-name-error");
const taskAssigneeError = document.getElementById("task-assignee-error");
const taskStatusError = document.getElementById("task-status-error");
const taskStartDateError = document.getElementById("task-start-date-error");
const taskEndDateError = document.getElementById("task-end-date-error");
const taskPriorityError = document.getElementById("task-priority-error");
const taskProgressError = document.getElementById("task-progress-error");
const addMemberModal = document.getElementById("add-member-modal");
const memberListModal = document.getElementById("member-list-modal");
const additionalMembers = document.getElementById("additional-members");
const memberList = document.getElementById("member-list");
const addMemberForm = document.getElementById("add-member-form");

document.addEventListener("DOMContentLoaded", function () {
  const taskModal = document.getElementById("task-modal");
  taskNameInput = document.getElementById("task-name");
  taskAssigneeSelect = document.getElementById("task-assignee");
  taskStatusSelect = document.getElementById("task-status");
  taskStartDateInput = document.getElementById("task-start-date");
  taskEndDateInput = document.getElementById("task-end-date");
  taskPrioritySelect = document.getElementById("task-priority");
  taskProgressSelect = document.getElementById("task-progress");
  const cancelTaskBtn = document.getElementById("cancel-task-btn");
  const closeTaskBtn = taskModal.querySelector(".close-btn");
  const addMemberModal = document.getElementById("add-member-modal");
  const memberListModal = document.getElementById("member-list-modal");
  const addMemberForm = document.getElementById("add-member-form");
  const memberList = document.getElementById("member-list");

  // Lấy thông tin người dùng đã đăng nhập
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  if (loggedInUser) {
    // Hiển thị tên Project Owner
    const projectOwnerElement = document.querySelector(".member .info p");
    projectOwnerElement.textContent = loggedInUser.fullName;

    // Hiển thị avatar của Project Owner
    const avatarElement = document.querySelector(".member .avatar-1");
    avatarElement.textContent = loggedInUser.fullName
      .split(" ")
      .map((word) => word[0])
      .join("");
  }

  document.getElementById("sort-tasks").addEventListener("change", function (e) {
    const sortBy = e.target.value; // Lấy giá trị sắp xếp
    const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
    const tasks = getTasksForProject(projectId); // Lấy danh sách nhiệm vụ từ dự án
  
    if (!sortBy) {
      renderTasks(); // Nếu không chọn tiêu chí, hiển thị danh sách gốc
      return;
    }
  
    // Clone lại dữ liệu nhiệm vụ để không ảnh hưởng tasks gốc
    const sortedTasks = JSON.parse(JSON.stringify(tasks));
  
    // Sắp xếp nhiệm vụ trong từng nhóm
    Object.keys(sortedTasks).forEach((group) => {
      sortedTasks[group].sort((a, b) => {
        if (sortBy === "priority") {
          // Sắp xếp theo độ ưu tiên
          const priorityOrder = { Cao: 1, "Trung bình": 2, Thấp: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        } else if (sortBy === "deadline") {
          // Sắp xếp theo hạn chót
          return new Date(a.endDate) - new Date(b.endDate);
        }
      });
    });
  
    // Gọi hàm render sau khi sắp xếp
    renderFilteredTasks(sortedTasks);
  });
  
  document.getElementById("search-task").addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase(); // Lấy từ khóa tìm kiếm
    const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
    const tasks = getTasksForProject(projectId); // Lấy danh sách nhiệm vụ từ dự án
  
    if (!searchTerm) {
      renderTasks(); // Nếu từ khóa tìm kiếm trống, hiển thị toàn bộ danh sách nhiệm vụ
      return;
    }
  
    // Lọc nhiệm vụ theo tên
    const filteredTasks = {};
    Object.keys(tasks).forEach((group) => {
      filteredTasks[group] = tasks[group].filter((task) =>
        task.name.toLowerCase().includes(searchTerm)
      );
    });
  
    // Gọi hàm render sau khi tìm kiếm
    renderFilteredTasks(filteredTasks);
  });

  // Gắn sự kiện cho nút "Hủy"
  cancelTaskBtn.addEventListener("click", closeTaskModal);

  // Gắn sự kiện cho nút "X"
  closeTaskBtn.addEventListener("click", closeTaskModal);

  document
    .getElementById("add-task-btn")
    .addEventListener("click", function () {
      renderAssignees(); // Hiển thị danh sách người phụ trách
      openTaskModal(); // Mở modal
    });

  document
    .getElementById("task-table-body")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("edit-btn")) {
        const taskId = parseInt(e.target.dataset.id, 10);
        const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
      const tasks = getTasksForProject(projectId);
        let taskToEdit = null;

        // Tìm nhiệm vụ cần sửa trong các nhóm
        Object.keys(tasks).forEach((group) => {
          const task = tasks[group].find((t) => t.id === taskId);
          if (task) {
            taskToEdit = task;
          }
        });

        if (taskToEdit) {
          openTaskModal(taskToEdit); // Mở modal và truyền dữ liệu nhiệm vụ
        }
      }
    });

  // Gắn sự kiện cho nút "Hủy"
  cancelTaskBtn.addEventListener("click", closeTaskModal);

  // Gắn sự kiện cho nút "X"
  closeTaskBtn.addEventListener("click", closeTaskModal);

  // Xử lý khi lưu nhiệm vụ
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
    if (!projectId) {
      alert("Không tìm thấy dự án. Vui lòng kiểm tra lại.");
      return;
    }
    const tasks = getTasksForProject(projectId);

    // Lấy giá trị từ các trường
    const taskName = taskNameInput.value.trim();
    const taskAssignee = taskAssigneeSelect.value;
    const taskStatus = taskStatusSelect.value;
    const taskStartDate = taskStartDateInput.value;
    const taskEndDate = taskEndDateInput.value;
    const taskPriority = taskPrioritySelect.value;
    const taskProgress = taskProgressSelect.value;

    const newTask = {
      id: editingTaskId || Date.now(), // Sử dụng timestamp làm ID nếu thêm mới
      name: taskName,
      assignee: taskAssignee,
      status: taskStatus,
      startDate: taskStartDate,
      endDate: taskEndDate,
      priority: taskPriority,
      progress: taskProgress,
    };
    // Reset thông báo lỗi
    taskNameError.textContent = "";
    taskAssigneeError.textContent = "";
    taskStatusError.textContent = "";
    taskStartDateError.textContent = "";
    taskEndDateError.textContent = "";

    let hasError = false;

    // Kiểm tra tên nhiệm vụ
    if (!taskName) {
      taskNameError.textContent = "Tên nhiệm vụ không được để trống.";
      hasError = true;
    } else if (taskName.length < 5 || taskName.length > 50) {
      taskNameError.textContent = "Tên nhiệm vụ phải từ 5 đến 50 ký tự.";
      hasError = true;
    }

    // Kiểm tra người phụ trách
    if (!taskAssignee) {
      taskAssigneeError.textContent = "Vui lòng chọn người phụ trách.";
      hasError = true;
    }

    // Kiểm tra trạng thái
    if (!taskStatus) {
      taskStatusError.textContent = "Vui lòng chọn trạng thái nhiệm vụ.";
      hasError = true;
    }

    // Kiểm tra ngày bắt đầu
    const today = new Date().toISOString().split("T")[0];
    if (!taskStartDate) {
      taskStartDateError.textContent = "Ngày bắt đầu không được để trống.";
      hasError = true;
    } else if (taskStartDate <= today) {
      taskStartDateError.textContent =
        "Ngày bắt đầu phải lớn hơn ngày hiện tại.";
      hasError = true;
    }

    // Kiểm tra hạn chót
    if (!taskEndDate) {
      taskEndDateError.textContent = "Hạn chót không được để trống.";
      hasError = true;
    } else if (taskEndDate <= taskStartDate) {
      taskEndDateError.textContent = "Hạn chót phải lớn hơn ngày bắt đầu.";
      hasError = true;
    }

    // Kiểm tra độ ưu tiên
    if (!taskPriority) {
      taskPriorityError.textContent = "Vui lòng chọn độ ưu tiên.";
      hasError = true;
    }

    // Kiểm tra tiến độ
    if (!taskProgress) {
      taskProgressError.textContent = "Vui lòng chọn tiến độ.";
      hasError = true;
    }

    // Nếu có lỗi, dừng xử lý
    if (hasError) {
      return;
    }

    if (editingTaskId !== null) {
      // Cập nhật nhiệm vụ
      Object.keys(tasks).forEach((group) => {
        const index = tasks[group].findIndex((t) => t.id === editingTaskId);
        if (index !== -1) {
          tasks[group].splice(index, 1); // Xóa nhiệm vụ cũ
        }
      });
    }
  
    // Thêm nhiệm vụ mới vào nhóm trạng thái
    if (!tasks[taskStatus]) {
      tasks[taskStatus] = [];
    }
    tasks[taskStatus].push(newTask);
  
    // Lưu danh sách nhiệm vụ vào dự án
    saveTasksForProject(projectId, tasks);
  
    // Đóng modal và cập nhật danh sách nhiệm vụ
    closeTaskModal();
    renderTasks();
  }); 

  // Gắn sự kiện cho nút "Sửa"
  document
    .getElementById("task-table-body")
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("edit-btn")) {
        const taskId = parseInt(e.target.dataset.id, 10);
        const tasks = JSON.parse(localStorage.getItem("tasks")) || {};
        let taskToEdit = null;

        // Tìm nhiệm vụ cần sửa trong các nhóm
        Object.keys(tasks).forEach((group) => {
          const task = tasks[group].find((t) => t.id === taskId);
          if (task) {
            taskToEdit = task;
          }
        });

        if (taskToEdit) {
          openTaskModal(taskToEdit); // Mở modal và truyền dữ liệu nhiệm vụ
        }
      }
    });

  // Gắn sự kiện cho nút "Xóa" trong danh sách nhiệm vụ
  document
  .getElementById("task-table-body")
  .addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
      const taskId = parseInt(e.target.dataset.id, 10); // Lấy ID nhiệm vụ từ nút
      const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
      const tasks = getTasksForProject(projectId); // Lấy danh sách nhiệm vụ của dự án

      // Tìm nhiệm vụ cần xóa
      let taskToDelete = null;
      Object.keys(tasks).forEach((group) => {
        const task = tasks[group].find((t) => t.id === taskId);
        if (task) {
          taskToDelete = task;
        }
      });

      if (taskToDelete) {
        showDeleteModal(taskToDelete, projectId); // Hiển thị modal xác nhận xóa
      }
    }
  });

  memberList.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.dataset.index;
      members.splice(index, 1);
      localStorage.setItem("members", JSON.stringify(members));
      renderMembers();
    }
  });

  // Mở modal thêm thành viên
  document
    .getElementById("add-member-btn")
    .addEventListener("click", function () {
      addMemberModal.style.display = "block";

      // Reset thông báo lỗi
      const emailError = document.getElementById("member-email-error");
      const roleError = document.getElementById("member-role-error");
      emailError.textContent = "";
      roleError.textContent = "";

      // Reset form
      addMemberForm.reset();
    });

  // Đóng modal thêm thành viên
  document
    .getElementById("close-add-member-modal")
    .addEventListener("click", function () {
      addMemberModal.style.display = "none";
      addMemberForm.reset();
    });

  document
    .getElementById("cancel-add-member-btn")
    .addEventListener("click", function () {
      addMemberModal.style.display = "none";
      addMemberForm.reset();
    });

  // Xử lý thêm thành viên
  addMemberForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
  const members = getMembersForProject(projectId);

    const email = document.getElementById("member-email").value.trim();
    const role = document.getElementById("member-role").value.trim();
    const emailError = document.getElementById("member-email-error");
    const roleError = document.getElementById("member-role-error");

    // Reset lỗi
    emailError.textContent = "";
    roleError.textContent = "";

    let hasError = false;

    // Kiểm tra email
    if (!email) {
      emailError.textContent = "Email không được để trống.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = "Email không đúng định dạng.";
      hasError = true;
    } else {
      // Kiểm tra email có tồn tại trong danh sách users không
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find((user) => user.email === email);

      if (!user) {
        emailError.textContent =
          "Email không tồn tại trong danh sách người dùng.";
        hasError = true;
      }
    }

    // Kiểm tra vai trò
    if (!role) {
      roleError.textContent = "Vai trò không được để trống.";
      hasError = true;
    }

    // Kiểm tra thành viên đã tồn tại
    if (members.some((member) => member.email === email)) {
      emailError.textContent = "Thành viên đã tồn tại.";
      hasError = true;
    }

    if (hasError) return;

    // Thêm thành viên mới
    members.push({ email, role });
  saveMembersForProject(projectId, members); // Lưu danh sách thành viên vào dự án

  renderMembers();

  // Đóng modal và reset form
  addMemberModal.style.display = "none";
  addMemberForm.reset();
  });

  const openMemberListModalBtn = document.getElementById(
    "open-member-list-modal"
  );
  const closeMemberListModalBtn = document.getElementById(
    "close-member-list-modal"
  );
  const closeMemberListBtn = document.getElementById("close-member-list-btn");
  const saveMemberBtn = document.getElementById("save-member-btn");

  memberList.addEventListener("click", function (e) {
    if (e.target.classList.contains("trash-icon")) {
      const index = e.target.dataset.index;

      // Xóa thành viên khỏi mảng
      members.splice(index, 1);

      // Cập nhật localStorage
      localStorage.setItem("members", JSON.stringify(members));

      // Cập nhật danh sách hiển thị
      renderMembers();
    }
  });

  // Mở modal danh sách thành viên
  openMemberListModalBtn.addEventListener("click", function () {
    memberListModal.style.display = "block";
  });

  // Đóng modal danh sách thành viên
  closeMemberListModalBtn.addEventListener("click", function () {
    memberListModal.style.display = "none";
  });

  closeMemberListBtn.addEventListener("click", function () {
    memberListModal.style.display = "none";
  });

  // Lưu thay đổi danh sách thành viên
  saveMemberBtn.addEventListener("click", function () {
    const rows = document.querySelectorAll("#member-list tr");
    members = []; // Reset danh sách thành viên

    rows.forEach((row) => {
      const name = row.querySelector(".info p").textContent;
      const email = row.querySelector(".info span").textContent;
      const role = row.querySelector("td[contenteditable='true']").textContent;

      members.push({ name, email, role });
    });

    // Lưu danh sách thành viên vào localStorage
    localStorage.setItem("members", JSON.stringify(members));

    // Cập nhật hiển thị
    renderMembers();

    // Đóng modal
    memberListModal.style.display = "none";
  });

  // Hiển thị danh sách nhiệm vụ khi tải trang
  renderProjectDetails();
  renderTasks();
  renderMembers();
});

function normalizeStatus(status) {
  const statusMap = {
    "to-do": "To do",
    "in-progress": "In Progress",
    pending: "Pending",
    done: "Done",
  };
  return statusMap[status.toLowerCase()] || status; // Trả về trạng thái đã chuẩn hóa
}

function getAssigneeNameById(assigneeId) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser && loggedInUser.id === assigneeId) {
    return loggedInUser.fullName; // Trả về tên của người dùng đã đăng nhập
  }
  return "Không xác định"; // Trả về giá trị mặc định nếu không tìm thấy
}

function getProjectFromURL() {
  const queryString = window.location.search;
  const queryParams = queryString.slice(1).split("&");

  let projectName = null;
  for (let param of queryParams) {
    const [key, value] = param.split("=");
    if (key === "projectName") {
      projectName = decodeURIComponent(value);
      break;
    }
  }

  if (projectName) {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    return projects.find((project) => project.name === projectName);
  }

  return null; // Trả về null nếu không tìm thấy dự án
}

function renderTasks() {
  const tableBody = document.getElementById("task-table-body");
  tableBody.innerHTML = ""; // Xóa nội dung cũ

  const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
  const tasks = getTasksForProject(projectId); // Lấy nhiệm vụ của dự án

  Object.keys(tasks).forEach((group) => {
    const groupRow = document.createElement("tr");
    groupRow.classList.add("group-row");
    groupRow.innerHTML = `
      <td colspan="7" class="group-header">
        <span class="toggle-btn">▶</span> ${group}
      </td>
    `;
    tableBody.appendChild(groupRow);

    if (Array.isArray(tasks[group]) && tasks[group].length > 0) {
      tasks[group].forEach((task) => {
        const taskRow = document.createElement("tr");
        taskRow.classList.add("task-row", "hidden");
        taskRow.innerHTML = `
          <td>${task.name}</td>
          <td class="center">${getAssigneeNameById(task.assignee)}</td>
          <td class="center"><span class="priority ${
            task.priority === "Thấp"
              ? "priority-low"
              : task.priority === "Trung bình"
              ? "priority-medium"
              : task.priority === "Cao"
              ? "priority-high"
              : ""
          }">${task.priority}</span></td>
          <td class="time">${task.startDate}</td>
          <td class="time">${task.endDate}</td>
          <td class="center"><span class="status ${
            task.progress === "Đúng tiến độ"
              ? "status-on-schedule"
              : task.progress === "Có rủi ro"
              ? "status-at-risk"
              : task.progress === "Trễ hạn"
              ? "status-late"
              : ""
          }">${task.progress}</span></td>
          <td class="center">
            <button class="edit-btn" data-id="${task.id}">Sửa</button>
            <button class="delete-btn" data-id="${task.id}">Xóa</button>
          </td>
        `;
        tableBody.appendChild(taskRow);
      });
    }

    groupRow
      .querySelector(".toggle-btn")
      .addEventListener("click", function () {
        const isHidden = this.textContent === "▶";
        this.textContent = isHidden ? "▼" : "▶";

        let taskRow = groupRow.nextElementSibling;
        while (taskRow && taskRow.classList.contains("task-row")) {
          taskRow.classList.toggle("hidden", !isHidden);
          taskRow = taskRow.nextElementSibling;
        }
      });
  });
}

function renderProjectDetails() {
  const project = getProjectFromURL();

  if (project) {
    const projectTitle = document.querySelector("h1");
    const projectDescriptionElement = document.getElementById(
      "project-description"
    );

    projectTitle.textContent = project.name; // Hiển thị tên dự án
    projectDescriptionElement.textContent = project.description; // Hiển thị mô tả dự án
  } else {
    window.location.href = "../pages/project-management.html"; // Điều hướng về trang quản lý dự án
  }
}

function renderAssignees() {
  const taskAssigneeSelect = document.getElementById("task-assignee");
  taskAssigneeSelect.innerHTML =
    '<option value="">Chọn người phụ trách</option>'; // Reset danh sách

  const project = getProjectFromURL(); // Lấy thông tin dự án từ URL

  if (project && project.members) {
    project.members.forEach((member) => {
      const option = document.createElement("option");
      option.value = member.id; // ID của người phụ trách
      option.textContent = member.fullName; // Tên của người phụ trách
      taskAssigneeSelect.appendChild(option);
    });
  }

  // Thêm Project Owner vào danh sách
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser) {
    const ownerOption = document.createElement("option");
    ownerOption.value = loggedInUser.id;
    ownerOption.textContent = `${loggedInUser.fullName}`;
    taskAssigneeSelect.appendChild(ownerOption);
  }
}

// Hiển thị modal xóa
function showDeleteModal(task, projectId) {
  const deleteModal = document.getElementById("delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const closeDeleteModalBtn = document.querySelector("#delete-modal .close-btn");

  // Hiển thị modal
  deleteModal.style.display = "block";

  // Gắn sự kiện cho nút "Xóa"
  confirmDeleteBtn.onclick = function () {
    deleteTask(task.id, projectId); // Xóa nhiệm vụ
    closeDeleteModal(); // Đóng modal
  };

  // Gắn sự kiện cho nút "Hủy" và nút đóng modal
  cancelDeleteBtn.onclick = closeDeleteModal;
  closeDeleteModalBtn.onclick = closeDeleteModal;
}

// Đóng modal xóa
function closeDeleteModal() {
  const deleteModal = document.getElementById("delete-modal");
  deleteModal.style.display = "none";
}

// Gắn sự kiện cho nút "Hủy" và nút "X"
cancelDeleteBtn.addEventListener("click", closeDeleteModal);
closeDeleteModalBtn.addEventListener("click", closeDeleteModal);

// Xử lý khi nhấn nút "Xóa"
confirmDeleteBtn.addEventListener("click", function () {
  if (taskToDelete !== null) {
    deleteTask(taskToDelete); // Gọi hàm xóa nhiệm vụ
    closeDeleteModal();
  }
});

// Hàm xóa nhiệm vụ
function deleteTask(taskId, projectId) {
  const tasks = getTasksForProject(projectId); // Lấy danh sách nhiệm vụ của dự án

  // Tìm và xóa nhiệm vụ
  Object.keys(tasks).forEach((group) => {
    tasks[group] = tasks[group].filter((task) => task.id !== taskId);
  });

  // Lưu lại danh sách nhiệm vụ vào dự án
  saveTasksForProject(projectId, tasks);

  // Cập nhật danh sách hiển thị
  renderTasks();
}

function getAssigneeNameById(assigneeId) {
  const project = getProjectFromURL(); // Lấy thông tin dự án từ URL
  if (project && project.members) {
    const member = project.members.find(
      (m) => m.id === parseInt(assigneeId, 10)
    );
    if (member) {
      return member.fullName; // Trả về tên của thành viên nếu tìm thấy
    }
  }

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (loggedInUser && loggedInUser.id === parseInt(assigneeId, 10)) {
    return loggedInUser.fullName; // Trả về tên của người dùng đã đăng nhập
  }

  return "Không xác định"; // Trả về giá trị mặc định nếu không tìm thấy
}

// Mở modal thêm/sửa nhiệm vụ
function openTaskModal(task = null) {
  const taskModal = document.getElementById("task-modal");
  taskModal.style.display = "block";

  if (task) {
    // Nếu chỉnh sửa, điền dữ liệu vào form
    editingTaskId = task.id;
    taskNameInput.value = task.name;
    taskAssigneeSelect.value = String(task.assignee); // Đảm bảo giá trị là chuỗi
    taskStatusSelect.value = task.status;
    taskStartDateInput.value = task.startDate;
    taskEndDateInput.value = task.endDate;
    taskPrioritySelect.value = task.priority;
    taskProgressSelect.value = task.progress;
  } else {
    // Nếu thêm mới, reset form
    editingTaskId = null;
    taskForm.reset();
  }
}

// Đóng modal
function closeTaskModal() {
  const taskModal = document.getElementById("task-modal");
  taskModal.style.display = "none";
  taskForm.reset();
  taskNameError.textContent = "";
  taskAssigneeError.textContent = "";
  taskStatusError.textContent = "";
  taskStartDateError.textContent = "";
  taskEndDateError.textContent = "";
  taskPriorityError.textContent = "";
  taskProgressError.textContent = "";
}

// Hiển thị danh sách thành viên
function renderMembers() {
  const memberList = document.getElementById("member-list");
  memberList.innerHTML = ""; // Xóa danh sách cũ

  const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
  const members = getMembersForProject(projectId);

  members.forEach((member, index) => {
    const fullName = getUserNameByEmail(member.email);
    const avatarText = getInitialsFromName(fullName); // avatar từ tên

    const memberRow = document.createElement("tr");
    const avatarHTML = `<div class="avatar">${avatarText}</div>`;

    memberRow.innerHTML = `
      <td>
        <div class="member">
          ${avatarHTML}
          <div class="info">
            <p>${fullName}</p>
            <span>${member.email}</span>
          </div>
        </div>
      </td>
      <td>${member.role}</td>
      <td><img src="../assets/icons/Trash.png" alt="" class="trash-icon" data-index="${index}"></td>
    `;
    memberList.appendChild(memberRow);
  });
}

// Lấy chữ cái đầu từ email
function getInitials(email) {
  return email
    .split("@")[0]
    .split(".")
    .map((word) => word[0].toUpperCase())
    .join("");
}

function getUserNameByEmail(email) {
  const users = JSON.parse(localStorage.getItem("users")) || []; // Lấy danh sách users từ localStorage

  // Tìm user dựa trên email
  const user = users.find((user) => user.email === email);

  // Nếu tìm thấy, trả về tên
  if (user) {
    return user.fullName;
  }

  // Nếu không tìm thấy, trả về giá trị mặc định
  return "Không xác định";
}

function addMemberToAdditionalMembers(email, role) {
  const additionalMembers = document.getElementById("additional-members");

  // Lấy tên user bằng email
  const userName = getUserNameByEmail(email);

  if (userName === "Không xác định") {
    console.error("Không tìm thấy người dùng với email:", email);
    return;
  }

  // Tạo avatar từ tên
  const initials = userName
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("");

  // Tạo HTML cho thành viên mới
  const memberDiv = document.createElement("div");
  memberDiv.classList.add("member");
  memberDiv.innerHTML = `
    <div class="avatar">${initials}</div>
    <div class="info">
      <p>${userName}</p>
      <span>${role}</span>
    </div>
  `;

  // Thêm thành viên vào "additional-members"
  additionalMembers.appendChild(memberDiv);
}

function getInitialsFromName(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 2); // Lấy 2 ký tự đầu
}

function renderFilteredTasks(filteredTasks) {
  const tableBody = document.getElementById("task-table-body");
  tableBody.innerHTML = ""; // Xóa nội dung cũ

  Object.keys(filteredTasks).forEach((group) => {
    if (filteredTasks[group].length > 0) {
      const groupRow = document.createElement("tr");
      groupRow.classList.add("group-row");
      groupRow.innerHTML = `
        <td colspan="7" class="group-header">
          <span class="toggle-btn">▼</span> ${group}
        </td>
      `;
      tableBody.appendChild(groupRow);

      filteredTasks[group].forEach((task) => {
        const taskRow = document.createElement("tr");
        taskRow.classList.add("task-row");
        taskRow.innerHTML = `
          <td>${task.name}</td>
          <td class="center">${getAssigneeNameById(task.assignee)}</td>
          <td class="center"><span class="priority ${
            task.priority === "Thấp"
              ? "priority-low"
              : task.priority === "Trung bình"
              ? "priority-medium"
              : task.priority === "Cao"
              ? "priority-high"
              : ""
          }">${task.priority}</span></td>
          <td class="time">${task.startDate}</td>
          <td class="time">${task.endDate}</td>
          <td class="center"><span class="status ${
            task.progress === "Đúng tiến độ"
              ? "status-on-schedule"
              : task.progress === "Có rủi ro"
              ? "status-at-risk"
              : task.progress === "Trễ hạn"
              ? "status-late"
              : ""
          }">${task.progress}</span></td>
          <td class="center">
            <button class="edit-btn" data-id="${task.id}">Sửa</button>
            <button class="delete-btn" data-id="${task.id}">Xóa</button>
          </td>
        `;
        tableBody.appendChild(taskRow);
      });
    }
  });
}

function saveTasksForProject(projectId, tasks) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  if (project) {
    project.tasks = tasks; // Gán danh sách nhiệm vụ vào dự án
    localStorage.setItem("projects", JSON.stringify(projects)); // Lưu lại toàn bộ danh sách dự án
  }
}

function getTasksForProject(projectId) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  return project?.tasks || {
    "To do": [],
    "In Progress": [],
    "Pending": [],
    "Done": [],
  };
}

function getProjectIdFromURL() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const projectName = urlParams.get("projectName"); // Lấy projectName từ URL

  if (!projectName) return null;

  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.name === decodeURIComponent(projectName));

  return project ? project.id : null; // Trả về projectId nếu tìm thấy
}

// Xóa nếu ko td
function saveTasksForProject(projectId, tasks) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  if (project) {
    project.tasks = tasks; // Gán danh sách nhiệm vụ vào dự án
    localStorage.setItem("projects", JSON.stringify(projects)); // Lưu lại toàn bộ danh sách dự án
  }
}

function getTasksForProject(projectId) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  return project?.tasks || {
    "To do": [],
    "In Progress": [],
    "Pending": [],
    "Done": [],
  };
}

function saveMembersForProject(projectId, members) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  if (project) {
    project.members = members; // Gán danh sách thành viên vào dự án
    localStorage.setItem("projects", JSON.stringify(projects)); // Lưu lại toàn bộ danh sách dự án
  }
}

function getMembersForProject(projectId) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  return project?.members || [];
}