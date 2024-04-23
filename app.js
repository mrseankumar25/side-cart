if (typeof CartDrawer !== "function") {
  class CartDrawer extends HTMLElement {
    constructor() {
      super()
      this.init()

      this.addEventListener('click', (e) => {
        const drawerDimensions = this.drawerWrapper.getBoundingClientRect()
        if (e.clientX < drawerDimensions.left || e.clientX > drawerDimensions.right || e.clientY < drawerDimensions.top || e.clientY > drawerDimensions.bottom) {
          this.close()
        }
      })
    }
    init() {
      this.drawerWrapper = this.querySelector('.drawerWrapper')

      this.itemControls = this.querySelectorAll('.quantityContole')
      this.items = this.querySelectorAll('[name^="updates"]')
      this.checkoutButton = this.querySelector('.button--checkout')
      this.checkInsurance = this.querySelector('.check-insurance')
      this.giftNoteInput = this.querySelector('.gift_note_input')
      this.giftNote = this.querySelector('.gift_note')
      this.slider = this.querySelector('.drawerSliderContainer')
      this.insurance = this.querySelector('.parcel-insurance')
      this.closeDrawer = this.querySelector('.closeDrawer')
      this.drawerNote = this.querySelector('.drawerNote')
      this.form = this.querySelector('form')

      this.initialActions()
    }
    initialActions() {
      if (this.drawerNote) {
        this.drawerNote.addEventListener('change', async () => {
          this.dataset.loading = true
          const noteReq = await fetch('/cart/update.json', {
            method: "POST",
            body: this.drawerNote.value
          })
          const noteRes = await noteReq.json()
          this.dataset.loading = false
        })
      }
      
      if (this.closeDrawer) {
        this.closeDrawer.addEventListener('click', () => {
          this.close()
        })
      }

      if (this.insurance) {
        this.insurance.addEventListener('change', async () => {
          this.dataset.loading = true
          if(this.insurance.checked) {
            const insurances = theme.insurances;
            let formData = new FormData();

            Object.entries(insurances).forEach(([key, val]) => {
              formData.append(`updates[${ key }]`, this.insurance.dataset.id == key ? 1 : 0);
            });

            fetch(window.Shopify.routes.root + 'cart/update.js', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => this.update());
          } else {
            const insurances = theme.insurances;
            let formData = new FormData();

            Object.entries(insurances).forEach(([key, val]) => {
              formData.append(`updates[${ key }]`, 0);
            });

            fetch(window.Shopify.routes.root + 'cart/update.js', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => this.update());
          }
        })
      }

      Array.from(this.itemControls).forEach(itemControl => {
        itemControl.addEventListener('click', async (e) => {
          e.preventDefault()
          const valInput = itemControl.closest('.quantity').querySelector('input')
          const itemControlID = itemControl.closest('.drawer-cart-item').dataset.id
          const cal = itemControl.classList.contains('quantityMinus') ? -1 : 1
          
          valInput.value = parseInt(valInput.value) + cal

          const insurances = theme.insurances;

          if(Object.keys(insurances).includes(itemControlID) && parseInt(valInput.value) === 0) {
            this.insurance.click()
          } else {
            let formData = new FormData();
            Array.from(this.items).forEach(i => {
              formData.append(`updates[${ i.dataset.id }]`, i.value);
            })
            Object.entries(insurances).forEach(([key, val]) => {
              formData.append(`updates[${ key }]`, 0);
            });
            
            this.dataset.loading = true
            fetch(window.Shopify.routes.root + 'cart/update.js', {
              method: 'POST',
              body: formData
            })
            .then(res => res.json())
            .then(res => {
              if(this.insurance && this.insurance.checked) {
                const insurancesPlans = theme.insurancesPlans;
                let insuranceformData = new FormData();
                let insuranceQty = Object.keys(insurances).includes(itemControlID) ? valInput.value : 1;
    
                Object.entries(insurancesPlans).forEach(([key, val]) => {
                  insuranceformData.append(`updates[${ key }]`, (res.total_price > val.min && val.min > val.max) || (res.total_price > val.min && val.max > res.total_price) ? insuranceQty : 0);
                });
    
                fetch(window.Shopify.routes.root + 'cart/update.js', {
                  method: 'POST',
                  body: insuranceformData
                })
                .then(response => response.json())
                .then(data => this.update());
              } else {
                this.update()
              }
            });
          }
        })
      })

      this.giftNoteInput.addEventListener('change', () => {
        let formData = new FormData();
        this.giftNote.innerHTML = ""
        formData.append(`updates[${ this.giftNoteInput.dataset.id }]`, this.giftNoteInput.checked ? 1 : 0);
        formData.append(`attributes[Gift Note]`, this.giftNote.value);

        this.dataset.loading = true
        fetch(window.Shopify.routes.root + 'cart/update.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => this.update());
      })

      this.giftNote.addEventListener('change', () => {
        let formData = new FormData();
        formData.append(`attributes[Gift Note]`, this.giftNote.value);

        this.dataset.loading = true
        fetch(window.Shopify.routes.root + 'cart/update.js', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => this.update());
      })
    }
    async update(show = true) {
      if(show) {
        this.show()
      }
      this.dataset.loading = true
      await this.render()
      this.init()
      this.dataset.loading = false
    }
    async render() {
      const drawerReq = await fetch('/pages/cart-drawer?view=cart-ajax')
      const drawerRes = await drawerReq.text()
      const $html = (new DOMParser()).parseFromString(drawerRes, "text/html")

      this.querySelector('.drawerWrapper').innerHTML = $html.querySelector('.drawerContainer').querySelector('.drawerWrapper').innerHTML
    }
    renderSlider() {
      jQuery(this.slider).slick({
        arrows: true,
        dots: false,
        infinite: true,
        nextArrow: '<svg class="slickArrow slickArrowRight" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 215 370.8"><polygon points="165.3,185.4 0,346 24.1,370.8 215,185.4 24.1,0 0,24.8"/></svg>',
        prevArrow: '<svg class="slickArrow slickArrowLeft" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 215 370.8"><polygon points="215,24.8 190.9,0 0,185.4 190.9,370.8 215,346 49.7,185.4"/></svg>',
        slidesToScroll: 1,
        slidesToShow: 3,
      })
    }
    close() {
      const el = window.getComputedStyle(this.drawerWrapper)
      const delay = (el['animation-duration']).includes("ms") ? parseInt(el['animation-duration']) : parseFloat(el['animation-duration']) * 1000

      document.body.classList.add('drawer-closing')

      setTimeout(() => {
        document.body.classList.remove('drawer-closing', 'drawer-open')
      }, delay);
    }
    show() {
      document.body.classList.add('drawer-open')
      this.renderSlider()
    }
  }
  customElements.define("cart-drawer", CartDrawer)
}