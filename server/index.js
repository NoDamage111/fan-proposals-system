require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const axios = require('axios');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { error } = require('console');

const FANS_EXCEL_FILE_PATH = path.join(__dirname, 'data', 'fans.xlsx');
const MOTORS_EXCEL_FILE_PATH = path.join(__dirname, 'data', 'motors.xlsx');
const FIVESCHEME_EXCEL_FILE_PATH = path.join(__dirname, 'data', '5_scheme.xlsx');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.vercel.app' // замените на реальный домен
  ],
  credentials: true
}));
app.use(express.json());

// Supabase клиент
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Глобальная переменная для хранения данных
let fansData = [];
let motorsData = [];
let fiveSchemeData = []



// Функция загрузки данных
async function loadFansData(EXCEL_FILE_PATH,) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Преобразуем в массив объектов
    fansData = XLSX.utils.sheet_to_json(worksheet) || []; // Всегда возвращаем массив

    console.log(`Загружено ${fansData.length} вентиляторов`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    fansData = []; // Всегда массив, даже при ошибке
  }
}

async function loadMotorsData(EXCEL_FILE_PATH,) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Преобразуем в массив объектов
    motorsData = XLSX.utils.sheet_to_json(worksheet) || []; // Всегда возвращаем массив

    console.log(`Загружено ${motorsData.length} моторов`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    motorsData = []; // Всегда массив, даже при ошибке
  }
}

async function loadFiveData(EXCEL_FILE_PATH,) {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Преобразуем в массив объектов
    fiveSchemeData = XLSX.utils.sheet_to_json(worksheet) || []; // Всегда возвращаем массив

    console.log(`Загружено ${fiveSchemeData.length} скоростей`);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    fiveSchemeData = []; // Всегда массив, даже при ошибке
  }
}

async function plotTwoCurvesToJPG(dataset1, dataset2, dataset3, dataset4, outputPath, options = {}) {
  const width = 450;
  const height = 500;


  // Создаём рендерер
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

  const configuration = {
    type: 'scatter', // Важно: используем точечный график!
    data: {
      datasets: [
        {
          label: options.label1 || 'Заданные точки',
          data: dataset1, // Массив точек {x, y}
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',
          borderWidth: 2,
          pointRadius: 0.5,
          showLine: true, // Соединяем точки линией
          tension: 0.1
        },
        {
          label: options.label2 || 'Интерполяция',
          data: dataset2, // Массив точек {x, y}
          backgroundColor: '#FF6384',
          borderColor: '#FF6384',
          borderWidth: 2,
          pointRadius: 0.5,
          showLine: true,
          tension: 0.1
        },
        {
          label: options.label3 || 'CrossPoint',
          data: dataset3, // Массив точек {x, y}
          backgroundColor: '#1F6386',
          borderColor: '#1F6386',
          borderWidth: 2,
          pointRadius: 3,
          showLine: true,
          tension: 0.1
        },
        {
          label: options.label4 || 'ReqPoint',
          data: dataset4, // Массив точек {x, y}
          backgroundColor: '#117722ff',
          borderColor: '#16753bff',
          borderWidth: 2,
          pointRadius: 3,
          showLine: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: false,
      scales: {
        x: {
          type: 'linear', // Числовая ось X
          title: {
            display: !!options.xLabel,
            text: options.xLabel || 'X Axis'
          }
        },
        y: {
          title: {
            display: !!options.yLabel,
            text: options.yLabel || 'Y Axis'
          },
          beginAtZero: false
        }
      },
      plugins: {
        title: {
          display: !!options.title,
          text: options.title || ''
        }
      }
    }
  };

  try {
    // const image = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/jpeg');
    const imageBase64 = await chartJSNodeCanvas.renderToDataURL(configuration)


    return {
      success: true,
      graph: {
        base64: imageBase64,
        // buffer: image, // Бинарные данные
        format: 'image/jpeg',
        additionalData: { // Любые дополнительные данные
          pointsCount: dataset1.length + dataset2.length + dataset3.length,
          createdAt: new Date().toISOString()
        }
      }
    }
  }
  catch (error) {
    console.error('Ошибка:', error);
  }
}

function leastSquaresInterpolation(points, degree) {
  // if (points.length < 5 || points.length > 10) {
  //     throw new Error('Количество точек должно быть от 5 до 10' + points.length);
  // }

  // Создаем матрицу для системы уравнений
  let X = [];
  let Y = [];
  const n = points.length;
  const m = degree + 1;

  // Инициализация матриц
  for (let i = 0; i < m; i++) {
    X[i] = new Array(m).fill(0);
    Y[i] = 0;
  }

  // Заполнение матриц
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += Math.pow(points[k].x, i + j);
      }
      X[i][j] = sum;
    }

    let sumY = 0;
    for (let k = 0; k < n; k++) {
      sumY += points[k].y * Math.pow(points[k].x, i);
    }
    Y[i] = sumY;
  }

  // Решение системы уравнений (методом Гаусса)
  for (let k = 0; k < m; k++) {
    // Поиск максимального элемента в текущем столбце
    let max = Math.abs(X[k][k]);
    let maxRow = k;
    for (let i = k + 1; i < m; i++) {
      if (Math.abs(X[i][k]) > max) {
        max = Math.abs(X[i][k]);
        maxRow = i;
      }
    }

    // Перестановка строк
    for (let i = k; i < m; i++) {
      let tmp = X[maxRow][i];
      X[maxRow][i] = X[k][i];
      X[k][i] = tmp;
    }
    let tmp = Y[maxRow];
    Y[maxRow] = Y[k];
    Y[k] = tmp;

    // Приведение к треугольному виду
    for (let i = k + 1; i < m; i++) {
      let c = -X[i][k] / X[k][k];
      for (let j = k; j < m; j++) {
        if (k === j) {
          X[i][j] = 0;
        } else {
          X[i][j] += c * X[k][j];
        }
      }
      Y[i] += c * Y[k];
    }
  }

  // Обратный ход (нахождение коэффициентов)
  let coefficients = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    coefficients[i] = Y[i] / X[i][i];
    for (let j = i - 1; j >= 0; j--) {
      Y[j] -= X[j][i] * coefficients[i];
    }
  }

  // Возвращаем функцию, которая вычисляет y для заданного x
  return function (x) {
    let y = 0;
    for (let i = 0; i < coefficients.length; i++) {
      y += coefficients[i] * Math.pow(x, i);
    }
    return y;
  };
}

function getInterpolateArray(baseArray, degree, stepCount) {

  let interpolateArray = []
  let step = (baseArray[baseArray.length - 1].x - baseArray[0].x) / stepCount

  let interpolate = leastSquaresInterpolation(baseArray, degree)

  for (let i = 0; i <= stepCount; i++) {
    let x = baseArray[0].x + i * step
    let y = interpolate(x)

    let tempPoint = {}

    tempPoint.x = x
    tempPoint.y = y


    interpolateArray.push(tempPoint)
  }
  // console.log(interpolateArray);

  return interpolateArray
}

function getArrayCurve(fan, startFirstMessage, endFirstMessage, startSecondMessage, endSecondMessage, endSecondMessageEnd) {
  const resultArray = [];
  let i = 1;

  while (startFirstMessage + `${i}` + endFirstMessage in fan) {
    let tempObj = {}

    tempObj.x = Number(fan[startFirstMessage + `${i}` + endFirstMessage]);
    tempObj.y = Number(fan[startSecondMessage + `${i}` + endSecondMessage]) || Number(fan[startSecondMessage + `${i}` + endSecondMessage + `${i}` + endSecondMessageEnd] || 0);

    if (tempObj.x == '0') {
      break
    }

    resultArray.push(tempObj)

    i++;
  }

  return resultArray
}

function getCross(curve, kpd, point) {

  //Вычисляем коэффициент системы
  let k = point.y / point.x / point.x


  //Проверяем границы
  if (curve[0].y < curve[0].x * curve[0].x * k || curve[curve.length - 1].y > curve[curve.length - 1].x * curve[curve.length - 1].x * k) {


    console.log("ne popali");
    return false
  }

  let currentIndex = curve.length / 2
  let step = curve.length / 2

  for (let i = 0; i <= 10; i++) {

    step = Math.floor(step / 2)
    if (curve[currentIndex].y > curve[currentIndex].x * curve[currentIndex].x * k) {
      currentIndex = currentIndex + step
    } else {
      currentIndex = currentIndex - step
    }
  }


  return [{
    x: Math.floor(curve[currentIndex].x),
    y: Math.floor(curve[currentIndex].x * curve[currentIndex].x * k),
    kpd: Math.floor(kpd[currentIndex].y)
  }]

}


// Инициализация загрузки
loadFansData(FANS_EXCEL_FILE_PATH);
loadMotorsData(MOTORS_EXCEL_FILE_PATH);
loadFiveData(FIVESCHEME_EXCEL_FILE_PATH);

// Обработчик для подбора вентиляторов
app.post('/api/fans/select', async (req, res) => {
  try {


    let baseCurveArray = []
    let baseKpdArray = []
    let curveArray = []
    let result = []
    let crossPoint = []
    
    // Фильтрация по параметрам (если они указаны)
    let filteredFans = [...fansData]
    let filteredMotors = [...motorsData]
    


    const { flow_rate, pressure, system, quantity, type, series, execution, climate, position, rotation, fluctuationPercentUp, fluctuationPercentDown, powerReserve, typeOfMotor, temperature, height, minFreq, maxFreq, calcType, startType, five, notice } = req.body


    if (type) {
      // console.log(filteredFans[0]);

      filteredFans = filteredFans.filter(fan => fan['Тип вентилятора'] === type)

    }

    if (series) {
      filteredFans = filteredFans.filter(fan => fan['Серия'] === series || series === 'Все')
    }

    if (execution) {
      filteredFans = filteredFans.filter(fan => fan[execution] === '1')
    }

    if (flow_rate) {
      filteredFans = filteredFans.filter(fan =>
        fan['Макс. расход, м3/ч'] >= flow_rate &&
        fan['Мин. расход, м3/ч'] <= flow_rate
      )
    }

    if (pressure) {
      filteredFans = filteredFans.filter(fan =>
        fan['Макс. давление, Па'] >= pressure
      )
    }

    // Поиск подходящих вентиляторов

    filteredFans = filteredFans.filter(fan => {

      baseCurveArray = getArrayCurve(fan, 'Расход ', ', м<sup>3</sup>/ч', 'Давление ', ', Па')

      baseKpdArray = getArrayCurve(fan, 'КПД расход ', ', м<sup>3</sup>/ч', 'КПД значение ', ', % / Мощность в точке ', ', кВт')

console.log(baseCurveArray);

      const density = 1.2920*(273.15/(273.15+Number(temperature)))*(1-Number(height)/10000)

      baseCurveArray.forEach(point => {
        const pressureDinamic = (calcType == 'Статический')?density*(point.x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)*(point.x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)/2:0
        point.y = Math.floor(point.y-pressureDinamic)
      });

      for (let i = 0; i < baseKpdArray.length; i++) {
        const pressureDinamic = (calcType == 'Статический')?density*(baseKpdArray[i].x/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)*(baseKpdArray[i]/fan["Площадь выходного отверстия (не для вентиляторов с безразмерными характеристиками), м2"]/3600)/2:0
        baseKpdArray[i].y = Math.floor(baseKpdArray[i].y*(baseCurveArray[i].y-pressureDinamic)/baseCurveArray[i].y)
      }


      console.log(baseCurveArray);
      // console.log(baseKpdArray);
      

      curveArray = getInterpolateArray(baseCurveArray, 3, 1023)
      kpdArray = getInterpolateArray(baseKpdArray, 3, 1023)
      // KpdArray = getInterpolateArray(baseKpdArray,3,20)
      crossPoint = getCross(curveArray, kpdArray, { x: flow_rate, y: pressure })
      // console.log(crossPoint);
      
      if (crossPoint == false) {
        return false
      }

      fan.reqPoint = [{
        x: Number(flow_rate),
        y: Number(pressure)
      }]
      fan.crossPoint = crossPoint
      fan.curveArray = curveArray
      fan.kpdArray = kpdArray
      fan.baseCurveArray = baseCurveArray
      fan.baseKpdArray = baseKpdArray
      fan.require = req.body
      return true
    }
    )

    //Подбор по умолчанию ( БЕЗ ПЧ и сх.5)
    if (startType != "Частотный преобразователь" && five == false) {
      console.log("Standart");
      // console.log(filteredFans);
      filteredFans = filteredFans.filter(fan =>
        fan['Исполнение 5 радиального вентилятора (ременная передача)'] != true
      )

      for (const fan of filteredFans) {
        // console.log(fan);
        let motorList = [0.06, 0.09, 0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3.0, 4.0, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 400];

        let baseSpeed = Math.floor(Number(fan["Макс. частота, об/мин"]) * flow_rate / fan.crossPoint[0].x);
        let arraySpeeds = [740, 980, 1450, 2900];
        let acceptedSpeed = []
        acceptedSpeed = arraySpeeds.filter(speed =>
          speed >= baseSpeed && speed <= fan["Макс. частота, об/мин"]
        );

        if (acceptedSpeed.length === 0) {
          acceptedSpeed = arraySpeeds.filter(speed =>
          speed >= baseSpeed/Math.pow(1+fluctuationPercentDown/100,1/2) && speed <= fan["Макс. частота, об/мин"])
        }

        if (acceptedSpeed.length === 0) {
          continue
        }

        fan.speed = acceptedSpeed[0];
        let kxSpeed = Number(fan["Макс. частота, об/мин"]) / fan.speed;

        fan.baseCurveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.curveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.crossPoint.forEach(point => {
          point.x = Math.floor(point.x / kxSpeed);
          point.y = Math.floor(point.y / kxSpeed / kxSpeed);
          point.kpd = Math.floor(point.kpd)
          point.power = (1+powerReserve/100)*Math.round(10*point.x*point.y/3600/point.kpd)/10
        });

        motorList = motorList.filter(motor => motor>fan.crossPoint[0].power)

        fan.crossPoint.forEach(point => {
          point.power = motorList[0]
        });
        

       if (fan.crossPoint[0].y>fan.reqPoint[0].y*(1+fluctuationPercentUp/100)) {
  
        continue
       }
       
       if (fan.crossPoint[0].y<fan.reqPoint[0].y*(1-fluctuationPercentDown/100)) {

        continue
       }

        // console.log(fan['Модель колеса']);

        fan.graph = await plotTwoCurvesToJPG(
          fan.baseCurveArray,
          fan.curveArray,
          fan.crossPoint,
          fan.reqPoint,
          fan.ID + '.jpg',
          {
            title: fan["Модель колеса"] + " " + fan.speed,
            xLabel: 'Производительность, м3/ч',
            yLabel: 'Давление, Па'
          }
        );

        result.push(fan)
      }

    }
    //Подбор с ПЧ
    if (startType == "Частотный преобразователь") {
      console.log("VFD");

      filteredFans = filteredFans.filter(fan =>
        fan['Исполнение 5 радиального вентилятора (ременная передача)'] != true
      )

    for (const fan of filteredFans) {
        // console.log(fan);

        let baseSpeed = Math.floor(Number(fan["Макс. частота, об/мин"]) * flow_rate / fan.crossPoint[0].x);


        if (baseSpeed<fan["Мин. частота, об/мин"]||baseSpeed>fan["Макс. частота, об/мин"]) {
          continue; // Пропускаем этот вентилятор, если нет подходящих скоростей
        }

        fan.speed = baseSpeed;
        let kxSpeed = Number(fan["Макс. частота, об/мин"]) / fan.speed;

        fan.baseCurveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.curveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.crossPoint.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        console.log(fan['Модель колеса']);

        fan.graph = await plotTwoCurvesToJPG(
          fan.baseCurveArray,
          fan.curveArray,
          fan.crossPoint,
          fan.reqPoint,
          fan.ID + '.jpg',
          {
            title: fan["Модель колеса"] + " " + fan.speed,
            xLabel: 'Производительность, м3/ч',
            yLabel: 'Давление, Па'
          }
        );

        result.push(fan)
      }
    }
    //Подбор 5 схема
    if (startType != "Частотный преобразователь" && five == true) {
      console.log("5 shema");

      filteredFans = filteredFans.filter(fan => fan['Исполнение 5 радиального вентилятора (ременная передача)'] == true)
      

  for (const fan of filteredFans) {
        // console.log(fan);
        let filteredFive = [...fiveSchemeData]
        filteredFive = filteredFive.filter(speed => speed['Колесо']== fan['Модель колеса'] )
        let baseSpeed = Math.floor(Number(fan["Макс. частота, об/мин"]) * flow_rate / fan.crossPoint[0].x);
        let arraySpeeds = []
        filteredFive.forEach(speed => {
          arraySpeeds.push(speed['Номинальные обороты вентилятора с данным двигателем, об/мин (нулевое значение - номинальные обороты берутся у двигателя)'])
        });

        // console.log(speed['Колесо']);
        
        
        console.log(arraySpeeds);

        // let arraySpeeds = [750, 1000, 1500, 3000];

        arraySpeeds = arraySpeeds.filter(speed =>
          speed >= baseSpeed && speed <= fan["Макс. частота, об/мин"]
        );

        if (arraySpeeds.length === 0) {
          continue; // Пропускаем этот вентилятор, если нет подходящих скоростей
        }

        fan.speed = arraySpeeds[0];
        let kxSpeed = Number(fan["Макс. частота, об/мин"]) / fan.speed;

        fan.baseCurveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.curveArray.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

        fan.crossPoint.forEach(point => {
          point.x = point.x / kxSpeed;
          point.y = point.y / kxSpeed / kxSpeed;
        });

       if (fan.crossPoint[0].y>fan.reqPoint[0].y*(1+fluctuationPercentUp/100)) {
        console.log('bolwe');      
        continue
       }
       
       if (fan.crossPoint[0].y<fan.reqPoint[0].y*(1-fluctuationPercentDown/100)) {
        console.log('bolwe');      
        continue
       }



        console.log(fan['Модель колеса']);

        fan.graph = await plotTwoCurvesToJPG(
          fan.baseCurveArray,
          fan.curveArray,
          fan.crossPoint,
          fan.reqPoint,
          fan.ID + '.jpg',
          {
            title: fan["Модель колеса"] + " " + fan.speed,
            xLabel: 'Производительность, м3/ч',
            yLabel: 'Давление, Па'
          }
        );
        
        result.push(fan)
      }
    }

    // Возвращаем либо отфильтрованные, либо фразу
    console.log(result.length);
    
    res.json(result.length > 0 ? result : null)
    //  res.json(filteredFans.length > 0 ? filteredFans : null)
  } catch (error) {
    console.error('Ошибка подбора вентиляторов:', error)
    res.status(500).json({ error: 'Ошибка подбора вентиляторов' })
  }
})

app.get('/api/fans/structure', (req, res) => {
  res.json({
    count: fansData.length,
    headers: fansData.length > 0 ? Object.keys(fansData[0]) : [],
    sample: fansData.length > 0 ? fansData[0] : null
  });
});
// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});