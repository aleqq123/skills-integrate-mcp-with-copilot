document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminModeCheckbox = document.getElementById("admin-mode");
  const adminSection = document.getElementById("admin-section");
  const createActivityForm = document.getElementById("create-activity-form");
  const adminMessage = document.getElementById("admin-message");
  
  let isAdminMode = false;
  let currentFilter = "all";

  // Toggle admin mode
  adminModeCheckbox.addEventListener("change", () => {
    isAdminMode = adminModeCheckbox.checked;
    if (isAdminMode) {
      adminSection.classList.remove("hidden");
    } else {
      adminSection.classList.add("hidden");
    }
    fetchActivities();
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.type;
      fetchActivities();
    });
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const url = currentFilter === "all" ? "/activities" : `/activities?activity_type=${currentFilter}`;
      const response = await fetch(url);
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.type = details.activity_type || "regular";

        const spotsLeft =
          details.max_participants - details.participants.length;
        
        // Activity type badge
        const typeBadge = `<span class="activity-type-badge ${details.activity_type || 'regular'}">${getTypeLabel(details.activity_type || 'regular')}</span>`;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        // Admin buttons
        const adminButtons = isAdminMode ? `
          <div class="admin-buttons">
            <button class="edit-btn" data-activity="${name}">Edit</button>
            <button class="delete-activity-btn" data-activity="${name}">Delete Activity</button>
          </div>
        ` : '';

        activityCard.innerHTML = `
          <h4>${name} ${typeBadge}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${adminButtons}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to admin buttons
      if (isAdminMode) {
        document.querySelectorAll(".edit-btn").forEach((button) => {
          button.addEventListener("click", handleEdit);
        });
        document.querySelectorAll(".delete-activity-btn").forEach((button) => {
          button.addEventListener("click", handleDeleteActivity);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function getTypeLabel(type) {
    const labels = {
      regular: "Regular",
      event: "Special Event",
      workshop: "Workshop",
      training: "Training"
    };
    return labels[type] || "Regular";
  }

  // Handle create activity
  createActivityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const activityData = {
      name: document.getElementById("activity-name").value,
      description: document.getElementById("activity-description").value,
      schedule: document.getElementById("activity-schedule").value,
      max_participants: parseInt(document.getElementById("activity-max").value),
      activity_type: document.getElementById("activity-type").value
    };

    try {
      const response = await fetch("/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(activityData)
      });

      const result = await response.json();

      if (response.ok) {
        adminMessage.textContent = result.message;
        adminMessage.className = "success";
        createActivityForm.reset();
        fetchActivities();
      } else {
        adminMessage.textContent = result.detail || "An error occurred";
        adminMessage.className = "error";
      }

      adminMessage.classList.remove("hidden");
      setTimeout(() => {
        adminMessage.classList.add("hidden");
      }, 5000);
    } catch (error) {
      adminMessage.textContent = "Failed to create activity. Please try again.";
      adminMessage.className = "error";
      adminMessage.classList.remove("hidden");
      console.error("Error creating activity:", error);
    }
  });

  // Handle edit activity
  async function handleEdit(event) {
    const activityName = event.target.dataset.activity;
    const newDescription = prompt("Enter new description (leave blank to keep current):");
    const newSchedule = prompt("Enter new schedule (leave blank to keep current):");
    
    if (newDescription === null && newSchedule === null) return;

    const updateData = {};
    if (newDescription) updateData.description = newDescription;
    if (newSchedule) updateData.schedule = newSchedule;

    if (Object.keys(updateData).length === 0) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok) {
        adminMessage.textContent = result.message;
        adminMessage.className = "success";
        fetchActivities();
      } else {
        adminMessage.textContent = result.detail || "An error occurred";
        adminMessage.className = "error";
      }

      adminMessage.classList.remove("hidden");
      setTimeout(() => {
        adminMessage.classList.add("hidden");
      }, 5000);
    } catch (error) {
      adminMessage.textContent = "Failed to update activity. Please try again.";
      adminMessage.className = "error";
      adminMessage.classList.remove("hidden");
      console.error("Error updating activity:", error);
    }
  }

  // Handle delete activity
  async function handleDeleteActivity(event) {
    const activityName = event.target.dataset.activity;
    
    if (!confirm(`Are you sure you want to delete "${activityName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (response.ok) {
        adminMessage.textContent = result.message;
        adminMessage.className = "success";
        fetchActivities();
      } else {
        adminMessage.textContent = result.detail || "An error occurred";
        adminMessage.className = "error";
      }

      adminMessage.classList.remove("hidden");
      setTimeout(() => {
        adminMessage.classList.add("hidden");
      }, 5000);
    } catch (error) {
      adminMessage.textContent = "Failed to delete activity. Please try again.";
      adminMessage.className = "error";
      adminMessage.classList.remove("hidden");
      console.error("Error deleting activity:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
