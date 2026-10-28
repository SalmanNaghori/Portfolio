const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

if (menuButton && navigation) {
  const closeMenu = () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 740) closeMenu();
  });
}

const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-feedback');

if (contactForm && contactFeedback) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const topic = String(formData.get('topic') || 'Portfolio inquiry');
    const message = String(formData.get('message') || '').trim();
    if (!name || !email || !message) {
      contactFeedback.textContent = 'Please complete your name, email and message.';
      return;
    }

    const subject = encodeURIComponent(`Portfolio inquiry: ${topic}`);
    const body = encodeURIComponent(`Hi Salman,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}\nTopic: ${topic}`);
    contactFeedback.textContent = 'Your email app should open with a prepared message. Please send it there. If it does not open, email salmannaghori@gmail.com directly.';
    window.location.href = `mailto:salmannaghori@gmail.com?subject=${subject}&body=${body}`;
  });
}
