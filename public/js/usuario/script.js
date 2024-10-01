document.addEventListener("DOMContentLoaded", function () {
  var options = ["1000", "1010", "1245", "1111", "2222", "3333"]; // Valores por defecto
  var startAngle = 0;
  var arc = Math.PI / (options.length / 2);
  var spinTimeout = null;
  var spinAngleStart = 0;
  var spinTime = 0;
  var spinTimeTotal = 0;
  var ctx;
  var winners = [];
  var maxSpins = 3;
  var spinsLeft = maxSpins;
  var timer;
  var scheduledTime;
  var apiKey = "6794028e-6203-4449-a850-567dd9d9ee07"; // Inserta aquí tu clave de API de Random.org

  document
    .getElementById("update-wheel")
    .addEventListener("click", updateWheel);
  document.getElementById("spin").addEventListener("click", spin);
  document
    .getElementById("update-datetime")
    .addEventListener("click", scheduleSpin);

  function drawRouletteWheel() {
    var canvas = document.getElementById("canvas");
    if (canvas && canvas.getContext) {
      var outsideRadius = (canvas.width / 2 - 10) * 0.8;
      var insideRadius = outsideRadius * 0.6;
      var textRadius = outsideRadius * 0.85;

      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;

      ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas antes de redibujar

      ctx.lineWidth = 3; // Aumentar grosor del borde para simular engrane
      ctx.strokeStyle = "black"; // Color del borde

      // Dibujar los trapecios siempre, aunque no queden opciones
      drawRotatingTrapezoids(centerX, centerY, outsideRadius, startAngle);

      if (options.length === 0) {
        // Si no quedan más opciones, dibujar un círculo vacío
        drawEmptyCircle(centerX, centerY, outsideRadius, insideRadius);
      } else {
        // Dibujar los segmentos de la ruleta para que esté delante de los trapecios
        arc = Math.PI / (options.length / 2); // Recalcula el arco según el número de participantes

        for (var i = 0; i < options.length; i++) {
          var angle = startAngle + i * arc;

          // Alternar colores grises para simular el efecto de engranaje
          if (i % 2 === 0) {
            ctx.fillStyle = "#d3d3d3"; // Gris claro
          } else {
            ctx.fillStyle = "#808080"; // Gris oscuro
          }

          ctx.beginPath();
          ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
          ctx.arc(centerX, centerY, insideRadius, angle + arc, angle, true);
          ctx.fill();
          ctx.stroke(); // Dibuja el borde del segmento
          ctx.save();

          ctx.fillStyle = "black"; // Color del texto
          ctx.translate(
            centerX + Math.cos(angle + arc / 2) * textRadius,
            centerY + Math.sin(angle + arc / 2) * textRadius
          );
          ctx.rotate(angle + arc / 2 + Math.PI / 2);
          var text = options[i];
          ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
          ctx.restore();
        }
      }

      // Dibujar la flecha
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY - (outsideRadius + 5));
      ctx.lineTo(centerX + 4, centerY - (outsideRadius + 5));
      ctx.lineTo(centerX + 4, centerY - (outsideRadius - 5));
      ctx.lineTo(centerX + 0, centerY - (outsideRadius - 13));
      ctx.lineTo(centerX - 4, centerY - (outsideRadius - 5));
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawEmptyCircle(centerX, centerY, outsideRadius, insideRadius) {
    // Dibujar el círculo vacío en lugar de la ruleta
    ctx.fillStyle = "#f0f0f0"; // Color gris claro para el círculo
    ctx.beginPath();
    ctx.arc(centerX, centerY, outsideRadius, 0, 2 * Math.PI, false);
    ctx.arc(centerX, centerY, insideRadius, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.stroke(); // Dibuja el borde del círculo
  }

  function drawRotatingTrapezoids(centerX, centerY, outsideRadius, angle) {
    var trapWidthTop = 50;
    var trapWidthBottom = 100;
    var trapHeight = 40;
    var numTrapezoids = 8; // Ocho trapecios
    var trapezoidAngle = (2 * Math.PI) / numTrapezoids; // Ángulo entre trapecios

    // Dibujar 8 trapecios alrededor del círculo, ajustando el radio y la altura
    for (var i = 0; i < numTrapezoids; i++) {
      var currentAngle = angle + i * trapezoidAngle;
      var x = centerX + Math.cos(currentAngle) * (outsideRadius + -10); // Ajustar el radio para alinearse al borde
      var y = centerY + Math.sin(currentAngle) * (outsideRadius + -10); // Ajustar el radio para alinearse al borde

      // Alternar colores grises para los trapecios
      var color = i % 2 === 0 ? "#d3d3d3" : "#808080"; // Alterna entre gris claro y gris oscuro

      // Mantener los trapecios orientados hacia fuera del círculo
      drawTrapezoid(
        x,
        y,
        trapWidthTop,
        trapWidthBottom,
        trapHeight,
        currentAngle + Math.PI / 2,
        color
      );
    }
  }

  function drawTrapezoid(
    centerX,
    centerY,
    topWidth,
    bottomWidth,
    height,
    angle,
    color
  ) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle); // Mantener la orientación del trapecio

    ctx.beginPath();
    ctx.moveTo(-topWidth / 2, -height);
    ctx.lineTo(topWidth / 2, -height);
    ctx.lineTo(bottomWidth / 2, 0);
    ctx.lineTo(-bottomWidth / 2, 0);
    ctx.closePath();
    ctx.strokeStyle = "black"; // Color del borde del trapecio
    ctx.fillStyle = color; // Color de relleno del trapecio
    ctx.lineWidth = 2; // Grosor del borde
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function spin() {
    if (spinsLeft > 0 && options.length > 0) {
      // Asegurar que hay opciones disponibles
      spinAngleStart = Math.random() * 10 + 10;
      spinTime = 0;
      spinTimeTotal = Math.random() * 3000 + 4000; // Duración del giro entre 4 y 7 segundos
      rotateWheel();
    }
  }

  function rotateWheel() {
    spinTime += 30;
    if (spinTime >= spinTimeTotal) {
      stopRotateWheel();
      return;
    }
    var spinAngle =
      spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
    startAngle += (spinAngle * Math.PI) / 180;
    drawRouletteWheel();
    spinTimeout = setTimeout(rotateWheel, 30);
  }

  function stopRotateWheel() {
    clearTimeout(spinTimeout);
    var degrees = (startAngle * 180) / Math.PI + 90;
    var arcd = (arc * 180) / Math.PI;
    var index = Math.floor((360 - (degrees % 360)) / arcd);

    winners.push(options[index]);

    document.getElementById(
      "winning-value-" + (maxSpins - spinsLeft)
    ).textContent = options[index];

    options.splice(index, 1); // Eliminar el valor ganador del arreglo de opciones
    spinsLeft--;

    if (spinsLeft > 0 && options.length > 0) {
      setTimeout(spin, 1000);
    } else {
      spinsLeft = maxSpins;
      drawRouletteWheel(); // Redibuja la ruleta con las opciones restantes
    }
  }

  function easeOut(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  }

  function fetchRandomNumbers(numParticipants) {
    return fetch("https://api.random.org/json-rpc/4/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "generateIntegers",
        params: {
          apiKey: apiKey,
          n: numParticipants, // Número de participantes
          min: 1000,
          max: 9999,
          replacement: true,
        },
        id: 42,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.result && data.result.random && data.result.random.data) {
          return data.result.random.data;
        } else {
          throw new Error("Error obteniendo números aleatorios");
        }
      });
  }

  function updateWheel() {
    var numParticipantsInput = document.getElementById("num-participants");
    var numParticipants = Number(numParticipantsInput.value);
    if (isNaN(numParticipants) || numParticipants < 1) {
      alert("Por favor, ingresa un número válido de participantes.");
      return;
    }

    fetchRandomNumbers(numParticipants)
      .then((randomNumbers) => {
        options = randomNumbers.map((number) => number.toString());
        arc = Math.PI / (options.length / 2); // Recalcula el arco según el número de participantes
        drawRouletteWheel(); // Redibuja la ruleta con los nuevos números
      })
      .catch((error) => {
        console.error("Error al obtener números aleatorios: ", error);
        alert("Hubo un problema al obtener los números aleatorios.");
      });
  }

  function scheduleSpin() {
    var dateInput = document.getElementById("date-input").value;
    var timeInput = document.getElementById("time-input").value;

    if (!dateInput || !timeInput) {
      alert("Por favor, ingresa una fecha y hora válidas.");
      return;
    }

    var selectedDateTime = new Date(dateInput + " " + timeInput);
    var now = new Date();

    if (selectedDateTime <= now) {
      alert("La fecha y hora deben ser en el futuro.");
      return;
    }

    scheduledTime = selectedDateTime;

    if (timer) clearInterval(timer);

    timer = setInterval(checkTimeForSpin, 1000);
  }

  function checkTimeForSpin() {
    var now = new Date();

    if (now >= scheduledTime) {
      clearInterval(timer);
      spin();
    }
  }

  drawRouletteWheel();
});
