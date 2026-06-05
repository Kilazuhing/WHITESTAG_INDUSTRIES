document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Mouse Position & Custom Cursor Trail
    // ==========================================================================
    const cursor = document.getElementById('custom-cursor');
    
    // Coordinates
    let mouse = { x: 0, y: 0 };      // Real mouse coordinates
    let cursorPosition = { x: 0, y: 0 }; // Lerped cursor coordinates
    
    // Lerp rate (linear interpolation for smooth trailing lag)
    const lerpRate = 0.12;

    // Track real mouse coordinates
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Show cursor when moving mouse
        if (!cursor.classList.contains('active')) {
            cursor.classList.add('active');
        }
    });

    // Fade out cursor when mouse leaves window
    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
    });

    // Custom Cursor Animation Loop
    const animateCursor = () => {
        // Lerp coordinates
        cursorPosition.x += (mouse.x - cursorPosition.x) * lerpRate;
        cursorPosition.y += (mouse.y - cursorPosition.y) * lerpRate;

        // Apply style translation
        cursor.style.left = `${cursorPosition.x}px`;
        cursor.style.top = `${cursorPosition.y}px`;

        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Hover states for links and buttons
    const interactiveElements = document.querySelectorAll('a, button, .service-card, .tab-btn, input, textarea, .checkbox-container');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
        });
    });

    // Click feedback state
    window.addEventListener('mousedown', () => {
        cursor.classList.add('click');
    });
    window.addEventListener('mouseup', () => {
        cursor.classList.remove('click');
    });


    // ==========================================================================
    // 2. Ambient Background Canvas Particles
    // ==========================================================================
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let particleCount = 45; // Sparse to maintain readability & performance
    let maxDistance = 110;  // Connect line distance

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle Object Definition
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4; // Slow drift velocity
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce boundary checks
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            // Mouse interaction (repulsion)
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 140) {
                // Soft repel
                const force = (140 - dist) / 140;
                this.x -= (dx / dist) * force * 1.5;
                this.y -= (dy / dist) * force * 1.5;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(118, 171, 174, ${this.alpha})`; // Soft Teal particle color
            ctx.fill();
        }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    // Draw lines between nearby particles
    const connectParticles = () => {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                
                if (dist < maxDistance) {
                    // Line opacity is stronger when nodes are closer
                    const alpha = (1 - dist / maxDistance) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 87, 34, ${alpha})`; // Soft Orange connection line
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
    };

    // Particles render loop
    const animateCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        connectParticles();
        requestAnimationFrame(animateCanvas);
    };
    animateCanvas();


    // ==========================================================================
    // 3. 3D Card Tilt Physics (Hero Visual & Service Cards)
    // ==========================================================================
    const tiltElements = document.querySelectorAll('.interactive-stage, .service-card');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            
            // Mouse position relative to center of element (-0.5 to 0.5)
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Max tilt limits (degrees)
            const maxTilt = 12;
            
            // Calculate rotations
            const rotX = -y * maxTilt;
            const rotY = x * maxTilt;
            
            el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        });

        el.addEventListener('mouseleave', () => {
            // Smoothly reset tilt back to zero
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });


    // ==========================================================================
    // 4. Magnetic Button Interaction
    // ==========================================================================
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .copy-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            
            // Calculate center point coordinates of the button
            const btnCenterX = rect.left + rect.width / 2;
            const btnCenterY = rect.top + rect.height / 2;
            
            // Distance on x and y axes between mouse and button center
            const dx = e.clientX - btnCenterX;
            const dy = e.clientY - btnCenterY;
            
            // Calculate translation pull offset
            const maxPull = 12; // Max pixel offset pull
            const pullX = dx * 0.25;
            const pullY = dy * 0.25;
            
            // Clamp offset values
            const clampedX = Math.min(Math.max(pullX, -maxPull), maxPull);
            const clampedY = Math.min(Math.max(pullY, -maxPull), maxPull);
            
            btn.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            // Smoothly snap back to origin
            btn.style.transform = 'translate(0px, 0px)';
        });
    });


    // ==========================================================================
    // 5. Dynamic Split-Text Character Slide-in Reveals
    // ==========================================================================
    const splitTitles = document.querySelectorAll('.hero-title, .section-title');

    splitTitles.forEach(title => {
        const text = title.textContent.trim();
        // Clear title node
        title.innerHTML = '';
        
        // Split text by word blocks
        const words = text.split(/\s+/);
        
        words.forEach((word, wordIdx) => {
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';
            
            // Split word by characters
            const chars = word.split('');
            chars.forEach((char) => {
                const charContainer = document.createElement('span');
                charContainer.classList.add('char-container');
                
                const charSpan = document.createElement('span');
                charSpan.classList.add('char');
                charSpan.textContent = char;
                
                charContainer.appendChild(charSpan);
                wordSpan.appendChild(charContainer);
            });
            
            title.appendChild(wordSpan);
            
            // Add a space character after the word (except the last word)
            if (wordIdx < words.length - 1) {
                const space = document.createTextNode(' ');
                title.appendChild(space);
            }
        });
    });

    // Reveal hero header letters immediately on load
    const revealHeroTitle = () => {
        const heroTitleChars = document.querySelectorAll('.hero-sec .char');
        heroTitleChars.forEach((char, index) => {
            setTimeout(() => {
                char.classList.add('revealed');
            }, 60 + index * 18); // Fast stagger letters
        });
    };
    
    // Stagger letters reveal observer for section titles
    const triggerTitleReveal = (target) => {
        const chars = target.querySelectorAll('.char');
        chars.forEach((char, index) => {
            setTimeout(() => {
                char.classList.add('revealed');
            }, index * 20); // Stagger delay
        });
    };


    // ==========================================================================
    // 6. Intersection Observer for Scroll Reveals & Counters
    // ==========================================================================
    const revealElements = document.querySelectorAll('.fade-in-element, .service-card, .timeline-step, .showcase-tabs, .showcase-display, .contact-grid');
    
    // Add base reveal classes
    revealElements.forEach(el => {
        if (!el.classList.contains('fade-in-element')) {
            el.classList.add('reveal-on-scroll');
        }
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // If it is a section title, trigger character animation
                if (entry.target.classList.contains('section-header') || entry.target.querySelector('.section-title')) {
                    const title = entry.target.querySelector('.section-title');
                    if (title) triggerTitleReveal(title);
                }
                
                // If the entry contains numeric values to animate
                const counters = entry.target.querySelectorAll('.metric-value, .stat-number, .camp-val, .wallet-bal');
                counters.forEach(c => runCounter(c));

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Also observe section headers specifically for title splits
    document.querySelectorAll('.section-header').forEach(header => {
        revealObserver.observe(header);
    });

    // Trigger hero characters right away
    setTimeout(revealHeroTitle, 200);

    // ==========================================================================
    // 7. Numerical Count-Up Function
    // ==========================================================================
    const runCounter = (el) => {
        if (el.dataset.animated === 'true') return;
        el.dataset.animated = 'true';

        const originalText = el.textContent.trim();
        
        // Find float or integers in the text
        const match = originalText.match(/[\d\.]+/);
        if (!match) return;

        const targetValue = parseFloat(match[0]);
        const isFloat = match[0].includes('.');
        const prefix = originalText.substring(0, match.index);
        const suffix = originalText.substring(match.index + match[0].length);

        let currentValue = 0;
        const duration = 1500; // 1.5 seconds count duration
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic calculation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            currentValue = targetValue * easeProgress;

            if (isFloat) {
                // Format decimal value (e.g. 99.9, 4.5)
                const decimals = match[0].split('.')[1].length;
                el.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;
            } else {
                // Integer
                el.textContent = `${prefix}${Math.floor(currentValue).toLocaleString()}${suffix}`;
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Ensure absolute correct final text
                el.textContent = originalText;
            }
        };

        requestAnimationFrame(updateCounter);
    };


    // ==========================================================================
    // 8. Navigation Scrollblur & Scroll-indicators
    // ==========================================================================
    const navbar = document.getElementById('main-nav');
    const scrollBar = document.getElementById('scroll-bar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    const handleScroll = () => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        
        scrollBar.style.width = `${scrollPercent}%`;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link tracking
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();


    // ==========================================================================
    // 9. Mobile Menu Hamburgers Toggles
    // ==========================================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const menuLinksContainer = document.getElementById('menu-links');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        menuLinksContainer.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            menuLinksContainer.classList.remove('active');
        });
    });


    // ==========================================================================
    // 10. Showcase Panel Tab Switcher Stagger Animation
    // ==========================================================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const showcasePanels = document.querySelectorAll('.showcase-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');

            showcasePanels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(`panel-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                
                // Trigger sub-counter animations again inside panel
                const panelCounters = targetPanel.querySelectorAll('.stat-number, .camp-val, .wallet-bal');
                panelCounters.forEach(c => {
                    c.dataset.animated = 'false'; // Reset state to animate again
                    runCounter(c);
                });
                
                // Stagger transition on sub-elements inside the card
                const elementsToAnimate = targetPanel.querySelectorAll('.panel-info > *, .phone-mockup, .browser-mockup, .campaign-mockup');
                elementsToAnimate.forEach((el, index) => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(15px)';
                    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                    
                    setTimeout(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0px)';
                    }, index * 80); // Stagger delays
                });
            }
        });
    });


    // ==========================================================================
    // 11. Clipboard copy and mailto inquiry generation
    // ==========================================================================
    const copyMailBtn = document.getElementById('copy-mail-btn');
    const copyBtnText = document.getElementById('copy-btn-text');
    const emailToCopy = 'kilazuhing@gmail.com';

    copyMailBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(emailToCopy).then(() => {
            copyBtnText.textContent = 'Copied!';
            copyMailBtn.classList.add('copied');
            
            copyMailBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                copyMailBtn.style.transform = 'none';
            }, 120);

            setTimeout(() => {
                copyBtnText.textContent = 'Copy';
                copyMailBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed: ', err);
            alert(`Copy failed, please copy manually: ${emailToCopy}`);
        });
    });

    const contactForm = document.getElementById('contact-mailto-form');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('form-name').value.trim();
        const company = document.getElementById('form-company').value.trim() || 'a Startup';
        const message = document.getElementById('form-message').value.trim();
        
        const checkedServices = [];
        const serviceCheckboxes = document.querySelectorAll('input[name="services"]:checked');
        serviceCheckboxes.forEach(cb => {
            checkedServices.push(cb.value);
        });

        const servicesString = checkedServices.length > 0 ? checkedServices.join(', ') : 'All Services';

        const recipient = 'kilazuhing@gmail.com';
        const subject = encodeURIComponent(`Project Inquiry: WhiteStag Collaboration - ${company}`);
        
        const bodyContent = `Dear WhiteStag Team,

My name is ${name} and I am reaching out on behalf of ${company}.

We are interested in discussing the following services:
- ${servicesString}

Project details & outline:
${message}

We look forward to hearing back from you.

Best regards,
${name}`;

        const body = encodeURIComponent(bodyContent);
        const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
        
        const submitBtn = document.getElementById('submit-form-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = 'Opening Client... ✨';
        submitBtn.style.opacity = '0.8';

        setTimeout(() => {
            window.location.href = mailtoUrl;
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
        }, 600);
    });
});
