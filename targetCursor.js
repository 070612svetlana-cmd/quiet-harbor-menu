/**
 * Кастомный курсор для блока «Разделы меню» (vanilla JS + GSAP).
 * Параметры как в TargetCursor: spinDuration, hideDefaultCursor, hoverDuration, parallaxOn.
 */
(function () {
  var targetSelector = '.cursor-target';
  var spinDuration = 2;
  var hideDefaultCursor = true;
  var hoverDuration = 0.2;
  var parallaxOn = true;
  var borderWidth = 3;
  var cornerSize = 12;

  function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    var hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var small = window.innerWidth <= 768;
    var ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    var mobileUa = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    return (hasTouch && small) || mobileUa;
  }

  function init() {
    if (typeof gsap === 'undefined') return;
    if (isMobileDevice()) return;

    var cursor = document.createElement('div');
    cursor.className = 'target-cursor-wrapper';
    cursor.innerHTML =
      '<div class="target-cursor-dot"></div>' +
      '<div class="target-cursor-corner corner-tl"></div>' +
      '<div class="target-cursor-corner corner-tr"></div>' +
      '<div class="target-cursor-corner corner-br"></div>' +
      '<div class="target-cursor-corner corner-bl"></div>';
    document.body.appendChild(cursor);

    var dotRef = cursor.querySelector('.target-cursor-dot');
    var cornersRef = cursor.querySelectorAll('.target-cursor-corner');

    var spinTl = null;
    var isActiveRef = false;
    var targetCornerPositionsRef = null;
    var tickerFnRef = null;
    var activeStrengthRef = { current: 0 };

    var activeTarget = null;
    var currentLeaveHandler = null;
    var resumeTimeout = null;

    var originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.style.cursor = 'none';
    }

    function moveCursor(x, y) {
      gsap.to(cursor, {
        x: x,
        y: y,
        duration: 0.1,
        ease: 'power3.out'
      });
    }

    function cleanupTarget(target) {
      if (currentLeaveHandler && target) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    }

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    function createSpinTimeline() {
      if (spinTl) spinTl.kill();
      spinTl = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
    }

    createSpinTimeline();

    function tickerFn() {
      if (!targetCornerPositionsRef || !cornersRef || cornersRef.length === 0) return;

      var strength = activeStrengthRef.current;
      if (strength === 0) return;

      var cursorX = gsap.getProperty(cursor, 'x');
      var cursorY = gsap.getProperty(cursor, 'y');

      var corners = Array.prototype.slice.call(cornersRef);
      corners.forEach(function (corner, i) {
        var currentX = gsap.getProperty(corner, 'x');
        var currentY = gsap.getProperty(corner, 'y');

        var targetX = targetCornerPositionsRef[i].x - cursorX;
        var targetY = targetCornerPositionsRef[i].y - cursorY;

        var finalX = currentX + (targetX - currentX) * strength;
        var finalY = currentY + (targetY - currentY) * strength;

        var duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    }

    tickerFnRef = tickerFn;

    function moveHandler(e) {
      moveCursor(e.clientX, e.clientY);
    }
    window.addEventListener('mousemove', moveHandler);

    function scrollHandler() {
      if (!activeTarget) return;
      var mouseX = gsap.getProperty(cursor, 'x');
      var mouseY = gsap.getProperty(cursor, 'y');
      var elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      var isStillOver =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget ||
          (typeof elementUnderMouse.closest === 'function' &&
            elementUnderMouse.closest(targetSelector) === activeTarget));
      if (!isStillOver && currentLeaveHandler) {
        currentLeaveHandler();
      }
    }
    window.addEventListener('scroll', scrollHandler, { passive: true });

    function mouseDownHandler() {
      if (!dotRef) return;
      gsap.to(dotRef, { scale: 0.7, duration: 0.3 });
      gsap.to(cursor, { scale: 0.9, duration: 0.2 });
    }

    function mouseUpHandler() {
      if (!dotRef) return;
      gsap.to(dotRef, { scale: 1, duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    }

    window.addEventListener('mousedown', mouseDownHandler);
    window.addEventListener('mouseup', mouseUpHandler);

    function enterHandler(e) {
      var directTarget = e.target;
      var allTargets = [];
      var current = directTarget;
      while (current && current !== document.body) {
        if (current.matches && current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      var target = allTargets[0] || null;
      if (!target) return;

      if (activeTarget === target) return;

      var prev = activeTarget;
      if (prev && prev !== target) {
        gsap.ticker.remove(tickerFnRef);
        isActiveRef = false;
        targetCornerPositionsRef = null;
        gsap.set(activeStrengthRef, { current: 0, overwrite: true });
      }
      if (prev) cleanupTarget(prev);
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      var corners = Array.prototype.slice.call(cornersRef);
      corners.forEach(function (corner) {
        gsap.killTweensOf(corner);
      });

      gsap.killTweensOf(cursor, 'rotation');
      if (spinTl) spinTl.pause();
      gsap.set(cursor, { rotation: 0 });

      var rect = target.getBoundingClientRect();
      var cursorX = gsap.getProperty(cursor, 'x');
      var cursorY = gsap.getProperty(cursor, 'y');

      targetCornerPositionsRef = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        {
          x: rect.right + borderWidth - cornerSize,
          y: rect.top - borderWidth
        },
        {
          x: rect.right + borderWidth - cornerSize,
          y: rect.bottom + borderWidth - cornerSize
        },
        {
          x: rect.left - borderWidth,
          y: rect.bottom + borderWidth - cornerSize
        }
      ];

      isActiveRef = true;
      gsap.ticker.add(tickerFnRef);

      gsap.to(activeStrengthRef, {
        current: 1,
        duration: hoverDuration,
        ease: 'power2.out'
      });

      corners.forEach(function (corner, i) {
        gsap.to(corner, {
          x: targetCornerPositionsRef[i].x - cursorX,
          y: targetCornerPositionsRef[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      function leaveHandler() {
        gsap.ticker.remove(tickerFnRef);

        isActiveRef = false;
        targetCornerPositionsRef = null;
        gsap.set(activeStrengthRef, { current: 0, overwrite: true });
        activeTarget = null;

        if (cornersRef && cornersRef.length) {
          var cornerList = Array.prototype.slice.call(cornersRef);
          gsap.killTweensOf(cornerList);
          var positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          var tl = gsap.timeline();
          cornerList.forEach(function (corner, index) {
            tl.to(
              corner,
              {
                x: positions[index].x,
                y: positions[index].y,
                duration: 0.3,
                ease: 'power3.out'
              },
              0
            );
          });
        }

        resumeTimeout = setTimeout(function () {
          if (!activeTarget && spinTl) {
            var currentRotation = gsap.getProperty(cursor, 'rotation');
            var normalizedRotation = currentRotation % 360;
            spinTl.kill();
            spinTl = gsap
              .timeline({ repeat: -1 })
              .to(cursor, {
                rotation: '+=360',
                duration: spinDuration,
                ease: 'none'
              });
            gsap.to(cursor, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: function () {
                if (spinTl) spinTl.restart();
              }
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      }

      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    }

    window.addEventListener('mouseover', enterHandler, { passive: true });

    window.__menuTargetCursorDestroy = function () {
      if (tickerFnRef) gsap.ticker.remove(tickerFnRef);
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
      if (activeTarget) cleanupTarget(activeTarget);
      if (spinTl) spinTl.kill();
      document.body.style.cursor = originalCursor;
      isActiveRef = false;
      targetCornerPositionsRef = null;
      activeStrengthRef.current = 0;
      if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
