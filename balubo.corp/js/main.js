document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm")
  const formError = document.getElementById("formError")

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('.nav a[href^="#"]')
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)

      if (targetSection) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = targetSection.offsetTop - headerHeight

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  })

  // Form validation and submission
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Clear previous error messages
    formError.style.display = "none"
    formError.textContent = ""

    // Get form data
    const formData = new FormData(contactForm)
    const name = formData.get("name").trim()
    const email = formData.get("email").trim()
    const message = formData.get("message").trim()

    // Validation
    const errors = []

    if (!name) {
      errors.push("お名前を入力してください。")
    }

    if (!email) {
      errors.push("メールアドレスを入力してください。")
    } else if (!isValidEmail(email)) {
      errors.push("正しいメールアドレスを入力してください。")
    }

    if (!message) {
      errors.push("お問い合わせ内容を入力してください。")
    }

    // Display errors if any
    if (errors.length > 0) {
      formError.innerHTML = errors.join("<br>")
      formError.style.display = "block"
      return
    }

    // If validation passes, show success message
    // In a real application, you would send the data to a server
    alert("お問い合わせありがとうございます。内容を確認の上、担当者よりご連絡いたします。")
    contactForm.reset()
  })

  // Email validation helper function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Add active class to navigation based on scroll position
  window.addEventListener("scroll", () => {
    const sections = document.querySelectorAll("section[id]")
    const navLinks = document.querySelectorAll('.nav a[href^="#"]')

    let current = ""
    const headerHeight = document.querySelector(".header").offsetHeight

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerHeight - 100
      const sectionHeight = section.offsetHeight

      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id")
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active")
      }
    })
  })
})
