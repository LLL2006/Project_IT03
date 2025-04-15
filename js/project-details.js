let members = JSON.parse(localStorage.getItem("members")) || [];
const taskModal = document.getElementById("task-modal");
const taskNameInput = document.getElementById("task-name");
const taskAssigneeSelect = document.getElementById("task-assignee");
const taskStatusSelect = document.getElementById("task-status");
const taskStartDateInput = document.getElementById("task-start-date");
const taskEndDateInput = document.getElementById("task-end-date");
const taskPrioritySelect = document.getElementById("task-priority");
const taskProgressSelect = document.getElementById("task-progress");
const cancelTaskBtn = document.getElementById("cancel-task-btn");
const closeTaskBtn = taskModal.querySelector(".close-btn");
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

  document
    .getElementById("sort-tasks")
    .addEventListener("change", function (e) {
      const sortBy = e.target.value; // Lấy giá trị sắp xếp
      const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
      const tasks = getTasksForProject(projectId); // Lấy danh sách nhiệm vụ từ dự án

      if (!sortBy) {
        renderTasks(); // Nếu không chọn tiêu chí, hiển thị danh sách gốc
        return;
      }

      const sortedTasks = JSON.parse(JSON.stringify(tasks));

      // Sắp xếp nhiệm vụ trong từng nhóm
      Object.keys(sortedTasks).forEach((group) => {
        sortedTasks[group].sort((a, b) => {
          if (sortBy === "priority") {
            const priorityOrder = { "Cao": 1, "Trung bình": 2, "Thấp": 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          } else if (sortBy === "deadline") {
            return new Date(a.endDate) - new Date(b.endDate);
          }
        });
      });

      renderFilteredTasks(sortedTasks);
    });

  document
    .getElementById("search-task")
    .addEventListener("input", function (e) {
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

  // Gắn sự kiện cho nút "Sửa" trong danh sách nhiệm vụ
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

  // Xử lý khi lưu nhiệm vụ
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const projectId = getProjectIdFromURL(); // Lấy projectId từ URL
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
      id: editingTaskId || Math.floor(Math.random() * 10000),
      name: taskName,
      assignee: taskAssignee,
      status: taskStatus,
      startDate: taskStartDate,
      endDate: taskEndDate,
      priority: taskPriority,
      progress: taskProgress,
    };

    taskNameError.textContent = "";
    taskAssigneeError.textContent = "";
    taskStatusError.textContent = "";
    taskStartDateError.textContent = "";
    taskEndDateError.textContent = "";

    let hasError = false;

    // Kiểm tra tên nhiệm vụ
    if (!taskName) {
      taskNameError.textContent = "Tên nhiệm vụ không được để trống";
      hasError = true;
    } else if (taskName.length < 5 || taskName.length > 50) {
      taskNameError.textContent = "Tên nhiệm vụ phải từ 5 đến 50 ký tự";
      hasError = true;
    }

    // Kiểm tra người phụ trách
    if (!taskAssignee) {
      taskAssigneeError.textContent = "Vui lòng chọn người phụ trách";
      hasError = true;
    }

    // Kiểm tra trạng thái
    if (!taskStatus) {
      taskStatusError.textContent = "Vui lòng chọn trạng thái nhiệm vụ";
      hasError = true;
    }

    // Kiểm tra ngày bắt đầu
    const today = new Date().toISOString().split("T")[0];
    if (!taskStartDate) {
      taskStartDateError.textContent = "Ngày bắt đầu không được để trống";
      hasError = true;
    } else if (taskStartDate <= today) {
      taskStartDateError.textContent =
        "Ngày bắt đầu phải lớn hơn ngày hiện tại";
      hasError = true;
    }

    // Kiểm tra hạn chót
    if (!taskEndDate) {
      taskEndDateError.textContent = "Hạn chót không được để trống";
      hasError = true;
    } else if (taskEndDate <= taskStartDate) {
      taskEndDateError.textContent = "Hạn chót phải lớn hơn ngày bắt đầu";
      hasError = true;
    }

    // Kiểm tra độ ưu tiên
    if (!taskPriority) {
      taskPriorityError.textContent = "Vui lòng chọn độ ưu tiên";
      hasError = true;
    }

    // Kiểm tra tiến độ
    if (!taskProgress) {
      taskProgressError.textContent = "Vui lòng chọn tiến độ";
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

    tasks[taskStatus].unshift(newTask);

    saveTasksForProject(projectId, tasks);
    closeTaskModal();
    renderTasks();
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
          showDeleteModal(taskToDelete, projectId);
        }
      }
    });

  // Mở danh sách thành viên
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

      const emailError = document.getElementById("member-email-error");
      const roleError = document.getElementById("member-role-error");
      emailError.textContent = "";
      roleError.textContent = "";

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
      emailError.textContent = "Email không được để trống";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = "Email không đúng định dạng";
      hasError = true;
    } else {
      // Kiểm tra email có tồn tại trong danh sách users không
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find((user) => user.email === email);

      if (!user) {
        emailError.textContent =
          "Email không tồn tại trong danh sách người dùng";
        hasError = true;
      }
    }

    // Kiểm tra vai trò
    if (!role) {
      roleError.textContent = "Vai trò không được để trống";
      hasError = true;
    }

    // Kiểm tra thành viên đã tồn tại
    if (members.some((member) => member.email === email)) {
      emailError.textContent = "Thành viên đã tồn tại";
      hasError = true;
    }

    if (hasError) return;

    // Thêm thành viên mới
    members.push({ email, role });
    saveMembersForProject(projectId, members);
    addMemberToAdditionalMembers(email, role);

    addMemberForm.reset();
    addMemberModal.style.display = "none";
  });

  // Gán sự kiện đóng/mở danh sách thành viên
  const openMemberListModalBtn = document.getElementById(
    "open-member-list-modal"
  );
  const closeMemberListModalBtn = document.getElementById(
    "close-member-list-modal"
  );
  const closeMemberListBtn = document.getElementById("close-member-list-btn");
  const saveMemberBtn = document.getElementById("save-member-btn");

  // Gán sự kiện xóa cho icon trong danh sách thành viên
  memberList.addEventListener("click", function (e) {
    if (e.target.classList.contains("trash-icon")) {
      const index = parseInt(e.target.dataset.index, 10);
      if (!isNaN(index)) {
        tempMembers.splice(index, 1); // Xoá trên mảng tạm
        renderMembers(tempMembers); // Render lại danh sách tạm
      }
    }
  });

  let tempMembers = []; // Mảng tạm thời chứa danh sách thành viên

  // Khi mở modal, gán tempMembers từ dữ liệu thật
  openMemberListModalBtn.addEventListener("click", function () {
    const projectId = getProjectIdFromURL();
    tempMembers = [...getMembersForProject(projectId)]; // Clone để không ảnh hưởng dữ liệu thật
    renderMembers(tempMembers);
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
    const updatedMembers = [];

    rows.forEach((row) => {
      const name = row.querySelector(".info p")?.textContent?.trim();
      const email = row.querySelector(".info span")?.textContent?.trim();
      const role = row
        .querySelector("td[contenteditable='true']")
        ?.textContent?.trim();

      if (email && role) {
        updatedMembers.push({ name, email, role });
      }
    });

    const projectId = getProjectIdFromURL();
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const project = projects.find((p) => p.id === parseInt(projectId, 10));

    if (project) {
      project.members = updatedMembers;
      localStorage.setItem("projects", JSON.stringify(projects));
    }

    // Đóng modal
    memberListModal.style.display = "none";

    // Cập nhật lại danh sách hiển thị chính
    renderMembers(updatedMembers);
  });

  // Hiển thị danh sách nhiệm vụ khi tải trang
  renderProjectDetails();
  renderTasks();
});

// Chuẩn hóa trạng thái
function normalizeStatus(status) {
  const statusMap = {
    "to-do": "To do",
    "in-progress": "In Progress",
    "pending": "Pending",
    "done": "Done",
  };
  return statusMap[status.toLowerCase()] || status; // Trả về trạng thái đã chuẩn hóa
}

// Lấy project từ URL
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
}

// Hiển thị danh sách nhiệm vụ theo nhóm trạng thái
function renderTasks() {
  const tableBody = document.getElementById("task-table-body");
  tableBody.innerHTML = "";

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
          <td class="center">${getAssigneeName(task.assignee)}</td>
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

// Hiển thị chi tiết thông tin dự án
function renderProjectDetails() {
  const project = getProjectFromURL();

  if (project) {
    const projectTitle = document.querySelector("h1");
    const projectDescriptionElement = document.getElementById(
      "project-description"
    );

    projectTitle.textContent = project.name; // Hiển thị tên dự án
    projectDescriptionElement.textContent = project.description; // Hiển thị mô tả dự án
  }
}

// Hiển thị người phụ trách nhiệm vụ
function renderAssignees() {
  const taskAssigneeSelect = document.getElementById("task-assignee");
  taskAssigneeSelect.innerHTML =
    '<option value="">Chọn người phụ trách</option>';

  const project = getProjectFromURL();
  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (project && project.members) {
    project.members.forEach((member, index) => {
      const option = document.createElement("option");

      option.value = member.id ?? member.email ?? `member-${index}`;

      // Lấy tên từ member hoặc từ users theo email
      let displayName = member.name || member.fullName;
      if (!displayName && member.email) {
        const foundUser = users.find((user) => user.email === member.email);
        displayName = foundUser?.name || foundUser?.fullName || member.email;
      }

      option.textContent = displayName;
      taskAssigneeSelect.appendChild(option);
    });
  }
}

// Hiển thị modal xóa
function showDeleteModal(task, projectId) {
  const deleteModal = document.getElementById("delete-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const closeDeleteModalBtn = document.querySelector(
    "#delete-modal .close-btn"
  );

  deleteModal.style.display = "block";

  // Gắn sự kiện cho nút "Xóa"
  confirmDeleteBtn.onclick = function () {
    deleteTask(task.id, projectId);
    closeDeleteModal();
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

  saveTasksForProject(projectId, tasks);

  renderTasks();
}

// Lấy tên người phụ trách từ email
function getAssigneeName(email) {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email);
  if (user) return user.fullName || user.name;
}

// Mở modal thêm/sửa nhiệm vụ
function openTaskModal(task = null) {
  const taskModal = document.getElementById("task-modal");
  taskModal.style.display = "block";

  if (task) {
    // Nếu chỉnh sửa, điền dữ liệu vào form
    editingTaskId = task.id;
    taskNameInput.value = task.name;
    taskAssigneeSelect.value = String(task.assignee);
    taskStatusSelect.value = task.status;
    taskStartDateInput.value = task.startDate;
    taskEndDateInput.value = task.endDate;
    taskPrioritySelect.value = task.priority;
    taskProgressSelect.value = task.progress;
  } else {
    editingTaskId = null;
    taskForm.reset();
  }
}

// Đóng modal thêm nhiệm vụ
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
function renderMembers(members) {
  const memberList = document.getElementById("member-list");
  memberList.innerHTML = "";

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  // Gán role là "Project Owner"
  const owner = {
    ...loggedInUser,
    role: "Project Owner",
  };

  if (!members) {
    members.unshift(owner);
  }

  members.forEach((member, index) => {
    const fullName = member.name || getUserNameByEmail(member.email);
    const avatarText = getInitialsFromName(fullName);

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
      <td contenteditable="true">${member.role}</td>
      <td>
        <img src="../assets/icons/Trash.png" alt="" class="trash-icon" data-index="${index}">
      </td>
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

// Lấy tên thành viên từ email
function getUserNameByEmail(email) {
  const users = JSON.parse(localStorage.getItem("users")) || []; // Lấy danh sách users từ localStorage

  // Tìm user dựa trên email
  const user = users.find((user) => user.email === email);

  // Nếu tìm thấy, trả về tên
  if (user) {
    return user.fullName;
  }
}

function addMemberToAdditionalMembers(email, role) {
  const additionalMembers = document.getElementById("additional-members");

  // Nếu đã có ít nhất 1 thành viên, không thêm nữa
  if (additionalMembers.children.length > 0) {
    return;
  }

  // Lấy tên user bằng email
  const userName = getUserNameByEmail(email);

  // Tạo avatar từ tên
  const initials = userName
    .split(" ")
    .map((word) => word[0].toUpperCase())
    .join("");

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
    .slice(0, 2);
}

// Hiển thị danh sách nhiệm vụ đã lọc
function renderFilteredTasks(filteredTasks) {
  const tableBody = document.getElementById("task-table-body");
  tableBody.innerHTML = "";

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
          <td class="center">${getAssigneeName(task.assignee)}</td>
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

// Lưu danh sách nhiệm vụ cho dự án
function saveTasksForProject(projectId, tasks) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  if (project) {
    project.tasks = tasks; // Gán danh sách nhiệm vụ vào dự án
    localStorage.setItem("projects", JSON.stringify(projects)); // Lưu lại toàn bộ danh sách dự án
  }
}

// Lấy danh sách nhiệm vụ cho dự án
function getTasksForProject(projectId) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === parseInt(projectId, 10));

  return (
    project?.tasks || {
      "To do": [],
      "In Progress": [],
      Pending: [],
      Done: [],
    }
  );
}

// Lấy projectId từ URL
function getProjectIdFromURL() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const projectName = urlParams.get("projectName"); // Lấy projectName từ URL

  if (!projectName) return null;

  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find(
    (p) => p.name === decodeURIComponent(projectName)
  );

  return project ? project.id : null; // Trả về projectId nếu tìm thấy
}

// Lưu danh sách thành viên cho dự án
function saveMembersForProject(projectId, members) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const index = projects.findIndex((p) => p.id === Number(projectId));

  if (index !== -1) {
    projects[index].members = members;
    localStorage.setItem("projects", JSON.stringify(projects));
  }
}

// Lấy danh sách thành viên cho dự án
function getMembersForProject(projectId) {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const project = projects.find((p) => p.id === Number(projectId));

  return project?.members ?? [];
}

function getUserNameByEmail(email) {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email);
  return user.fullName;
}
