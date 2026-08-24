export const PRODUCT_TOUR_KEY="bragstack_product_tour_v1";
export function startProductTour(){localStorage.removeItem(PRODUCT_TOUR_KEY);window.dispatchEvent(new Event("bragstack:start-tour"));if(window.location.pathname!=="/app")window.location.assign("/app?tour=1");}
