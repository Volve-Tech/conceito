import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';

/**
 * Fisher–Yates shuffle of an element's children (Next testimonials order).
 */
function shuffleChildren(parent: Element) {
  const items = Array.from(parent.children);
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = items[i];
    const swap = items[j];
    items[i] = swap;
    items[j] = current;
  }
  items.forEach((node) => parent.appendChild(node));
}

/**
 * Custom prev/next only — no pagination or scrollbar.
 */
function navConfig(root: HTMLElement) {
  return {
    navigation: {
      nextEl: root.querySelector<HTMLElement>('.swiper-nav-next'),
      prevEl: root.querySelector<HTMLElement>('.swiper-nav-prev'),
    },
  };
}

/**
 * Initialize Services (peek slides) and Testimonials (single slide) Swipers.
 */
export function initCarousels() {
  document.querySelectorAll<HTMLElement>('[data-swiper="services"]').forEach((el) => {
    new Swiper(el, {
      modules: [Navigation],
      slidesPerView: 1.1,
      spaceBetween: 0,
      ...navConfig(el),
      breakpoints: {
        600: { slidesPerView: 2.5 },
        960: { slidesPerView: 3.5 },
        1280: { slidesPerView: 3.5 },
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-swiper="testimonials"]').forEach((el) => {
    const wrapper = el.querySelector('.swiper-wrapper');
    if (wrapper) shuffleChildren(wrapper);

    new Swiper(el, {
      modules: [Navigation],
      slidesPerView: 1,
      spaceBetween: 0,
      ...navConfig(el),
    });
  });
}
