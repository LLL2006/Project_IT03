document.addEventListener("DOMContentLoaded", function () {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const sortSelect = document.getElementById("sort-tasks");
    const searchInput = document.getElementById("search-task");
  
    renderTasks(projects);
  
    // Sự kiện sắp xếp
    sortSelect.addEventListener("change", function () {
      const sortBy = this.value; // Lấy giá trị sắp xếp
      renderTasks(projects, sortBy, searchInput.value.trim());
    });
  
    // Sự kiện tìm kiếm
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      renderTasks(projects, sortSelect.value, searchTerm);
    });
  
    const updateModal = document.getElementById("update-status-modal");
    const closeUpdateModalBtn = document.getElementById("close-update-modal");
    const cancelUpdateBtn = document.getElementById("cancel-update-btn");
    const confirmUpdateBtn = document.getElementById("confirm-update-btn");
  
    let currentTask = null; // Lưu nhiệm vụ hiện tại cần cập nhật
    let currentProject = null; // Lưu dự án chứa nhiệm vụ
  
    // Hàm mở modal
    function openUpdateModal(task, project) {
      currentTask = task;
      currentProject = project;
      updateModal.style.display = "block";
    }
  
    // Hàm đóng modal
    function closeUpdateModal() {
      updateModal.style.display = "none";
      currentTask = null;
      currentProject = null;
    }
  
    // Gắn sự kiện cho nút đóng và hủy
    closeUpdateModalBtn.addEventListener("click", closeUpdateModal);
    cancelUpdateBtn.addEventListener("click", closeUpdateModal);
  
    // Gắn sự kiện cho nút xác nhận
    confirmUpdateBtn.addEventListener("click", function () {
      if (currentTask && currentProject) {
        // Chuyển trạng thái theo thứ tự
        const statusOrder = ["To do", "In Progress", "Pending", "Done"];
        const currentIndex = statusOrder.indexOf(currentTask.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        currentTask.status = statusOrder[nextIndex];
  
        // Lưu lại thay đổi vào localStorage
        saveProjectsToLocalStorage(projects);
  
        // Cập nhật lại giao diện
        renderTasks(projects, sortSelect.value, searchInput.value.trim());
      }
      closeUpdateModal();
    });
  
  
    // Cập nhật sự kiện click cho icon "Edit" trong renderTasks
    function attachEditEvent() {
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
          const taskId = parseInt(this.dataset.id, 10);
          const projectId = parseInt(this.dataset.projectId, 10);
  
          const project = projects.find((p) => p.id === projectId);
          if (project) {
            const task = Object.values(project.tasks)
              .flat()
              .find((t) => t.id === taskId);
            if (task) {
              openUpdateModal(task, project);
            }
          }
        });
      });
    }
  
    // Render lại bảng và gắn sự kiện
    function renderTasks(projects, sortBy = "", searchTerm = "") {
      const tableBody = document.getElementById("task-table-body");
      tableBody.innerHTML = ""; // Xóa nội dung cũ
  
      // Duyệt qua từng dự án
      projects.forEach((project) => {
        if (project.tasks) {
          // Tạo hàng tiêu đề cho dự án
          const projectRow = document.createElement("tr");
          projectRow.classList.add("project-row");
          projectRow.innerHTML = `
            <td colspan="6" class="project-header">
              <span class="toggle-btn">▼</span> ${project.name}
            </td>
          `;
          tableBody.appendChild(projectRow);
  
          // Duyệt qua từng nhóm nhiệm vụ (To do, In Progress, Pending, Done)
          Object.keys(project.tasks).forEach((group) => {
            let tasks = [...project.tasks[group]]; // ✅ tạo bản sao để sắp xếp

  // Tìm kiếm nhiệm vụ
  if (searchTerm) {
    tasks = tasks.filter((task) =>
      task.name.toLowerCase().includes(searchTerm)
    );
  }

  // Sắp xếp nhiệm vụ
  if (sortBy === "priority") {
    const priorityOrder = { "Cao": 1, "Trung bình": 2, "Thấp": 3 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else if (sortBy === "deadline") {
    tasks.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  }
    
  
            if (tasks.length > 0) {
              tasks.forEach((task) => {
                // Tạo hàng cho từng nhiệm vụ
                const taskRow = document.createElement("tr");
                taskRow.classList.add("task-row");
                taskRow.innerHTML = `
                  <td>${task.name}</td>
                  <td class="center"><span class="priority ${
                    task.priority === "Thấp"
                      ? "priority-low"
                      : task.priority === "Trung bình"
                      ? "priority-medium"
                      : task.priority === "Cao"
                      ? "priority-high"
                      : ""
                  }">${task.priority}</span></td>
                  <td class="center">${task.status} <img src="../assets/icons/Edit.png" alt="Edit" class="edit-btn" data-id="${task.id}" data-project-id="${project.id}"></td>
                  <td class="time">${task.startDate}</td>
                  <td class="time">${task.endDate}</td>
                  <td class="center"><span class="progress ${
                    task.progress === "Đúng tiến độ"
                      ? "progress-on-schedule"
                      : task.progress === "Có rủi ro"
                      ? "progress-at-risk"
                      : task.progress === "Trễ hạn"
                      ? "progress-late"
                      : ""
                  }">${task.progress}</span></td>
                `;
                tableBody.appendChild(taskRow);
              });
            }
          });
  
          // Gắn sự kiện toggle để ẩn/hiện nhiệm vụ của dự án
          projectRow.querySelector(".toggle-btn").addEventListener("click", function () {
            const isHidden = this.textContent === "▼";
            this.textContent = isHidden ? "▶" : "▼";
  
            let nextRow = projectRow.nextElementSibling;
            while (nextRow && nextRow.classList.contains("task-row")) {
              nextRow.style.display = isHidden ? "none" : "table-row";
              nextRow = nextRow.nextElementSibling;
            }
          });
        }
      });
  
      // Gắn sự kiện cho các nút "Edit"
      attachEditEvent();
    }
  });

  console.log("Sorted tasks:", allTasks);
1