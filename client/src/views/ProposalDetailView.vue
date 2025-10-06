<template>
  <v-container>
    <v-card class="pa-6">
      <template v-if="proposalsStore.isLoading && !proposalsStore.currentProposal">
        <v-progress-circular indeterminate></v-progress-circular>
      </template>
      
      <template v-else-if="proposalsStore.error">
        <v-alert type="error">{{ proposalsStore.error }}</v-alert>
      </template>
      
      <template v-else-if="proposalsStore.currentProposal">
        <v-card-title class="text-h4 mb-2">
          {{ proposalsStore.currentProposal.title }}
        </v-card-title>
        
        <v-card-subtitle class="text-h6 mb-4">
          Создано: {{ new Date(proposalsStore.currentProposal.created_at).toLocaleDateString() }}
        </v-card-subtitle>
        
        <v-card-text>
          <p class="text-body-1 mb-6">
            {{ proposalsStore.currentProposal.description || 'Описание отсутствует' }}
          </p>
          
          <v-divider class="my-4"></v-divider>
          
          <v-card-title class="text-h5 pa-0 mb-4">
            Выбранные вентиляторы
          </v-card-title>
          
          <v-alert
            v-if="!proposalsStore.currentProposal.proposal_fans?.length"
            type="info"
          >
            Вентиляторы не добавлены
          </v-alert>
          
          <v-list v-else>
            <v-list-item
              v-for="fan in proposalsStore.currentProposal.proposal_fans"
              :key="fan.id"
              class="mb-4"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-fan" color="primary"></v-icon>
              </template>
              
              <v-list-item-title class="text-h6">
                {{ fan.fan_data["Модель колеса"] }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="mt-2">
                <v-chip
                  v-for="(value, key) in {
                    'Расход': `${fan.fan_data.crossPoint[0].x} м³/ч`,
                    'Давление': `${fan.fan_data.crossPoint[0].y} Па`,
                    'Мощность': `${fan.fan_data.crossPoint[0].power} кВт`,
                    'КПД': `${fan.fan_data.crossPoint[0].kpd} %`
                  }"
                  :key="key"
                  class="mr-2 mb-2"
                  size="small"
                >
                  {{ key }}: {{ value }}
                </v-chip>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="outlined"
                  class="ml-2"
                  @click="showFanDetails(fan)"
                >
                  Данные
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-dialog
            v-model="showFanDialog"
            max-width="800px"
            scrollable
          >
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span>Технические данные вентилятора</span>
                <v-btn
                  icon
                  @click="showFanDialog = false"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>

              <v-card-text>
                <div v-if="selectedFanData">
                  <v-list>
                    <v-list-item>
                      <v-list-item-title class="text-h6">
                        {{ selectedFanData.fan_data['Модель колеса'] }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        {{ selectedFanData.fan_data['Тип вентилятора'] }}
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider class="my-2"></v-divider>

                    <v-list-item>
                      <v-list-item-title>Основные параметры:</v-list-item-title>
                    </v-list-item>

                    <v-list-item>
                      <div class="parameters-list">
                        <div class="parameter-item">
                          <span class="parameter-label">Фактический расход:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.x || 'Н/Д' }} м³/ч</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Фактическое давление:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.y || 'Н/Д' }} Па</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Мощность:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.power || 'Н/Д' }} кВт</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">КПД:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.crossPoint?.[0]?.kpd || 'Н/Д' }} %</span>
                        </div>
                        <div class="parameter-item">
                          <span class="parameter-label">Скорость вращения:</span>
                          <span class="parameter-value">{{ selectedFanData.fan_data?.speed || 'Н/Д' }} об/мин</span>
                        </div>
                      </div>
                    </v-list-item>

                    <v-list-item>
                      <v-card class="mt-4" flat>
                        <v-card-title class="text-subtitle-1">
                          Аэродинамическая характеристика
                        </v-card-title>
                        <v-card-text>
                          <div class="chart-container">
                            <img 
                              id="fan-dialog-image"
                              :src="selectedFanData.fan_data?.graph?.graph?.base64" 
                              alt="Аэродинамическая характеристика"
                              style="max-width: 400px; max-height: 600px;"
                            />
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-list-item>

                    <v-list-item>
                      <v-list-item-title>Примечание:</v-list-item-title>
                      <v-list-item-subtitle>
                        <div>{{ selectedFanData.fan_data.require?.notice || 'Нет примечания' }}</div>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  @click="showFanDialog = false"
                >
                  Закрыть
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-divider class="my-4"></v-divider>

        </v-card-text>
        
        <v-card-actions>
          <v-btn
            to="/proposals"
            variant="text"
            color="grey"
          >
            Назад к списку
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn
            color="secondary"
            class="mr-2"
            @click="generateRTF"
            :loading="isGeneratingRTF"
            prepend-icon="mdi-file-word-box"
          >
            Сохранить в RTF
          </v-btn>

          <v-btn
            color="primary"
            @click="generatePDF"
            :loading="isGeneratingPDF"
            prepend-icon="mdi-file-pdf-box"
          >
            Сохранить в PDF
          </v-btn>
        </v-card-actions>
      </template>
      
      <template v-else>
        <v-alert type="warning">Предложение не найдено</v-alert>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
import { useProposalsStore } from '@/stores/proposals'
import { useRoute } from 'vue-router'
import pdfMake from 'pdfmake/build/pdfmake'
import blueprintImage from '@/components/blueprintexamle.jpg'
import headerImage from '@/components/header.jpg'
import footerImage from '@/components/footer.jpg'

// Устанавливаем шрифты для поддержки кириллицы
const fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
}

pdfMake.fonts = fonts

const proposalsStore = useProposalsStore()
const route = useRoute()

// Данные для диалога
const showFanDialog = ref(false)
const selectedFanData = ref(null)
const isGeneratingPDF = ref(false)
const isGeneratingRTF = ref(false)

onMounted(() => {
  loadProposal()
})

watch(() => route.params.id, () => {
  loadProposal()
})

const loadProposal = async () => {
  if (route.params.id) {
    await proposalsStore.fetchProposalById(route.params.id)
  }
}

const showFanDetails = (fan) => {
  selectedFanData.value = fan
  showFanDialog.value = true
  
  nextTick(() => {
    const dialogImage = document.querySelector('#fan-dialog-image');
    if (dialogImage && fan.fan_data?.graph?.graph?.base64) {
      dialogImage.src = fan.fan_data.graph.graph.base64;
      dialogImage.style.maxWidth = '400px';
      dialogImage.style.maxHeight = '600px';
    }
  });
}

// Функция для загрузки изображения как base64
const loadImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return null
  }
}

// Функция для конвертации base64 в ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  try {
    const base64Data = base64.split(',')[1]
    const binaryString = atob(base64Data)
    const length = binaryString.length
    const bytes = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  } catch (error) {
    console.error('Ошибка конвертации base64:', error)
    return null
  }
}

// Функция для загрузки изображения как ArrayBuffer
const loadImageAsArrayBuffer = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error)
    return null
  }
}

// Исправленная функция конвертации SVG в PNG
const convertSVGtoPNG = async (svgBase64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        // Заливаем белым фоном
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем изображение
        ctx.drawImage(img, 0, 0, 400, 600);
        
        // Конвертируем в data URL
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      } catch (error) {
        console.error('Ошибка конвертации SVG в PNG:', error);
        reject(error);
      }
    };
    
    img.onerror = function(error) {
      console.error('Ошибка загрузки SVG:', error);
      reject(new Error('Не удалось загрузить SVG изображение'));
    };
    
    img.src = svgBase64;
  });
};

const generatePDF = async () => {
  isGeneratingPDF.value = true
  
  try {
    const proposal = proposalsStore.currentProposal
    if (!proposal || !proposal.proposal_fans?.length) {
      alert('Нет данных для генерации PDF')
      return
    }

    // Загружаем изображения для хэдера и футера
    const headerBase64 = await loadImageAsBase64(headerImage)
    const footerBase64 = await loadImageAsBase64(footerImage)
    const blueprintBase64 = await loadImageAsBase64(blueprintImage)

    // Высота хэдера и футера
    const headerHeight = 60
    const footerHeight = 40

    // Хэдер для каждой страницы
    const header = (currentPage, pageCount) => {
      return {
        image: headerBase64,
        width: 595,
        alignment: 'center',
        margin: [0, 10, 0, 0]
      }
    }

    // Футер для каждой страницы
    const footer = (currentPage, pageCount) => {
      return {
        stack: [
          {
            image: footerBase64,
            width: 595,
            alignment: 'center',
            margin: [0, 10, 0, 5]
          },
          {
            text: `Страница ${currentPage} из ${pageCount}`,
            alignment: 'center',
            fontSize: 8,
            color: '#666666',
            margin: [0, 0, 0, 10]
          }
        ]
      }
    }

    const documentDefinition = {
      pageSize: 'A4',
      pageMargins: [40, headerHeight + 20, 40, footerHeight + 20],
      header: header,
      footer: footer,
      styles: {
        documentTitle: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center',
          color: '#2c3e50'
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 10],
          color: '#1976d2'
        },
        subsectionTitle: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5],
          color: '#2c3e50'
        },
        normalText: {
          fontSize: 10,
          margin: [0, 2, 0, 2]
        },
        tableHeader: {
          bold: true,
          fontSize: 9,
          color: 'white',
          fillColor: '#1976d2'
        },
        tableCell: {
          fontSize: 8
        },
        noteText: {
          fontSize: 9,
          italics: true,
          color: '#666',
          margin: [0, 5, 0, 0]
        }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      },
      content: []
    }

    // Заголовок документа
    documentDefinition.content.push(
      {
        text: `ТЕХНИЧЕСКОЕ КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ`,
        style: 'documentTitle',
        pageBreak: 'before'
      },
      {
        text: `№ ${proposal.id.slice(0, 8).toUpperCase()}`,
        style: 'subsectionTitle',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: `Название: ${proposal.title}`,
        style: 'subsectionTitle',
        margin: [0, 0, 0, 5]
      },
      {
        text: `Описание: ${proposal.description || 'Не указано'}`,
        style: 'normalText',
        margin: [0, 0, 0, 15]
      },
      {
        text: `Дата создания: ${new Date(proposal.created_at).toLocaleDateString('ru-RU')}`,
        style: 'normalText',
        margin: [0, 0, 0, 20]
      }
    )

    // Для каждого вентилятора создаем раздел
    for (const [index, fan] of proposal.proposal_fans.entries()) {
      const fanData = fan.fan_data
      const require = fanData.require || {}

      // Раздел вентилятора
      documentDefinition.content.push(
        {
          text: `ВЕНТИЛЯТОР ${index + 1}`,
          style: 'sectionTitle',
          pageBreak: index > 0 ? 'before' : undefined
        },
        {
          text: `Модель: ${fanData['Модель колеса'] || 'Не указана'}`,
          style: 'subsectionTitle',
          margin: [0, 0, 0, 10]
        }
      )

      // Заданные параметры
      documentDefinition.content.push(
        {
          text: 'ЗАДАННЫЕ ПАРАМЕТРЫ',
          style: 'subsectionTitle',
          margin: [0, 10, 0, 5]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              [
                { text: 'Параметр', style: 'tableHeader' },
                { text: 'Значение', style: 'tableHeader' }
              ],
              [
                { text: 'Производительность', style: 'tableCell' },
                { text: `${require.flow_rate || 'Н/Д'} м³/ч`, style: 'tableCell' }
              ],
              [
                { text: 'Давление', style: 'tableCell' },
                { text: `${require.pressure || 'Н/Д'} Па`, style: 'tableCell' }
              ],
              [
                { text: 'Тип вентилятора', style: 'tableCell' },
                { text: require.type || 'Н/Д', style: 'tableCell' }
              ],
              [
                { text: 'Исполнение', style: 'tableCell' },
                { text: require.execution || 'Н/Д', style: 'tableCell' }
              ],
              [
                { text: 'Температура', style: 'tableCell' },
                { text: `${require.temperature || 'Н/Д'} °C`, style: 'tableCell' }
              ],
              [
                { text: 'Тип двигателя', style: 'tableCell' },
                { text: require.typeOfMotor || 'Н/Д', style: 'tableCell' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#cccccc'; },
            vLineColor: function(i, node) { return '#cccccc'; }
          },
          margin: [0, 0, 0, 10]
        }
      )

      // Результаты подбора
      documentDefinition.content.push(
        {
          text: 'РЕЗУЛЬТАТЫ ПОДБОРА',
          style: 'subsectionTitle',
          margin: [0, 10, 0, 5]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              [
                { text: 'Параметр', style: 'tableHeader' },
                { text: 'Значение', style: 'tableHeader' }
              ],
              [
                { text: 'Фактическая производительность', style: 'tableCell' },
                { text: `${fanData.crossPoint?.[0]?.x || 'Н/Д'} м³/ч`, style: 'tableCell' }
              ],
              [
                { text: 'Фактическое давление', style: 'tableCell' },
                { text: `${fanData.crossPoint?.[0]?.y || 'Н/Д'} Па`, style: 'tableCell' }
              ],
              [
                { text: 'Мощность', style: 'tableCell' },
                { text: `${fanData.crossPoint?.[0]?.power || 'Н/Д'} кВт`, style: 'tableCell' }
              ],
              [
                { text: 'КПД', style: 'tableCell' },
                { text: `${fanData.crossPoint?.[0]?.kpd || 'Н/Д'} %`, style: 'tableCell' }
              ],
              [
                { text: 'Скорость вращения', style: 'tableCell' },
                { text: `${fanData.speed || 'Н/Д'} об/мин`, style: 'tableCell' }
              ],
              [
                { text: 'Количество', style: 'tableCell' },
                { text: `${fan.quantity || 1} шт.`, style: 'tableCell' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#cccccc'; },
            vLineColor: function(i, node) { return '#cccccc'; }
          },
          margin: [0, 0, 0, 10]
        }
      )

      // График аэродинамической характеристики
      if (fanData.graph?.graph?.base64) {
        try {
          let chartImage = fanData.graph.graph.base64;
          
          // Если это SVG, конвертируем в PNG
          if (fanData.graph.graph.format === 'image/svg+xml') {
            console.log('Конвертация SVG в PNG...');
            chartImage = await convertSVGtoPNG(fanData.graph.graph.base64);
          }
          
          documentDefinition.content.push(
            {
              text: 'АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА',
              style: 'subsectionTitle',
              margin: [0, 10, 0, 5]
            },
            {
              image: chartImage,
              width: 350,
              alignment: 'center',
              margin: [0, 5, 0, 5]
            },
            {
              text: `Вентилятор: ${fanData['Модель колеса']}, скорость вращения: ${fanData.speed} об/мин`,
              style: 'noteText',
              alignment: 'center',
              margin: [0, 0, 0, 10]
            }
          );
        } catch (error) {
          console.error('Ошибка добавления графика в PDF:', error);
          documentDefinition.content.push(
            {
              text: 'АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА',
              style: 'subsectionTitle',
              margin: [0, 10, 0, 5]
            },
            {
              text: 'График недоступен для отображения в PDF',
              style: 'noteText',
              margin: [0, 0, 0, 10]
            }
          );
        }
      } else {
        documentDefinition.content.push(
          {
            text: 'АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА',
            style: 'subsectionTitle',
            margin: [0, 10, 0, 5]
          },
          {
            text: 'График не доступен',
            style: 'noteText',
            margin: [0, 0, 0, 10]
          }
        );
      }

      // Примечание
      if (require.notice) {
        documentDefinition.content.push(
          {
            text: `Примечание: ${require.notice}`,
            style: 'noteText',
            margin: [0, 5, 0, 15]
          }
        )
      }

      // Чертеж (на отдельной странице)
      documentDefinition.content.push(
        {
          text: 'ГАБАРИТНО-ПРИСОЕДИНИТЕЛЬНЫЕ РАЗМЕРЫ',
          style: 'sectionTitle',
          pageBreak: 'before'
        }
      )

      if (blueprintBase64) {
        documentDefinition.content.push(
          {
            image: blueprintBase64,
            width: 350,
            alignment: 'center',
            margin: [0, 10, 0, 10]
          },
          {
            text: 'Пример чертежа - окончательный чертеж будет предоставлен после подтверждения заказа',
            style: 'noteText',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          }
        )
      }

      // Технические характеристики
      documentDefinition.content.push(
        {
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              [
                { text: 'Характеристика', style: 'tableHeader' },
                { text: 'Значение', style: 'tableHeader' }
              ],
              [
                { text: 'Габаритные размеры', style: 'tableCell' },
                { text: 'Будут указаны в рабочих чертежах', style: 'tableCell' }
              ],
              [
                { text: 'Присоединительные размеры', style: 'tableCell' },
                { text: 'Согласно технической документации', style: 'tableCell' }
              ],
              [
                { text: 'Масса', style: 'tableCell' },
                { text: fanData['Масса, кг'] ? `${fanData['Масса, кг']} кг` : 'Уточняется при заказе', style: 'tableCell' }
              ],
              [
                { text: 'Способ монтажа', style: 'tableCell' },
                { text: 'Согласно проекту', style: 'tableCell' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i, node) { return 0.5; },
            vLineWidth: function(i, node) { return 0.5; },
            hLineColor: function(i, node) { return '#cccccc'; },
            vLineColor: function(i, node) { return '#cccccc'; }
          },
          margin: [0, 0, 0, 20]
        }
      )
    }

    // Генерируем и скачиваем PDF
    console.log('Начинаем генерацию PDF...');
    const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
    
    pdfDocGenerator.getBlob((blob) => {
      console.log('PDF blob создан, размер:', blob.size);
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ТКП_${proposal.title}_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('PDF файл пустой');
      }
    });
    
  } catch (error) {
    console.error('Ошибка генерации PDF:', error)
    alert('Ошибка при генерации PDF файла: ' + error.message)
  } finally {
    isGeneratingPDF.value = false
  }
}

const generateRTF = async () => {
  isGeneratingRTF.value = true
  
  try {
    const proposal = proposalsStore.currentProposal
    if (!proposal || !proposal.proposal_fans?.length) {
      alert('Нет данных для генерации RTF')
      return
    }

    // Загружаем изображения для хэдера и футера
    const headerBuffer = await loadImageAsArrayBuffer(headerImage)
    const footerBuffer = await loadImageAsArrayBuffer(footerImage)
    const blueprintBuffer = await loadImageAsArrayBuffer(blueprintImage)

    // Функция для добавления изображения в RTF
    const addImageToRTF = (buffer, widthGoal, heightGoal) => {
      if (!buffer) return ''
      try {
        const bytes = new Uint8Array(buffer)
        let hexString = ''
        for (let i = 0; i < bytes.length; i++) {
          hexString += bytes[i].toString(16).padStart(2, '0')
        }
        return `{\\pict\\pngblip\\picwgoal${widthGoal}\\pichgoal${heightGoal}\n${hexString}\n}`
      } catch (error) {
        console.error('Ошибка добавления изображения:', error)
        return ''
      }
    }

    // Функция для конвертации кириллицы в Unicode
    const toUnicodeRTF = (text) => {
      if (!text) return ''
      let result = ''
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        if (charCode > 127) {
          result += `\\u${charCode}?`
        } else {
          result += text[i]
        }
      }
      return result
    }

    // Функция для создания таблицы в RTF
    const createTableRTF = (rows, columns = 2) => {
      let tableRTF = ''
      const columnWidth = 5000
      
      rows.forEach(row => {
        tableRTF += '{\\trowd'
        tableRTF += '\\trbrdrt\\brdrs\\brdrw10\\brdrcf0'
        tableRTF += '\\trbrdrl\\brdrs\\brdrw10\\brdrcf0'
        tableRTF += '\\trbrdrb\\brdrs\\brdrw10\\brdrcf0'
        tableRTF += '\\trbrdrr\\brdrs\\brdrw10\\brdrcf0'
        tableRTF += '\\trgaph100'
        
        for (let i = 0; i < columns; i++) {
          tableRTF += `\\cellx${(i + 1) * columnWidth}`
        }
        
        row.forEach((cell, cellIndex) => {
          const isBold = cell.bold
          const isHeader = cell.fillColor
          const cellContent = toUnicodeRTF(cell.text || cell)
          
          tableRTF += `{`
          tableRTF += '\\clbrdrt\\brdrs\\brdrw10\\brdrcf0'
          tableRTF += '\\clbrdrl\\brdrs\\brdrw10\\brdrcf0'
          tableRTF += '\\clbrdrb\\brdrs\\brdrw10\\brdrcf0'
          tableRTF += '\\clbrdrr\\brdrs\\brdrw10\\brdrcf0'
          
          if (isHeader) {
            tableRTF += '\\clcbpat15'
          }
          
          tableRTF += '\\clvertalt\\clpadl100\\clpadt50\\clpadb50\\clpadr100'
          tableRTF += '\\pard\\intbl\\ql'
          
          if (isBold) tableRTF += '\\b'
          tableRTF += ' ' + cellContent + ' '
          if (isBold) tableRTF += '\\b0'
          
          tableRTF += '\\cell}'
        })
        
        tableRTF += '\\row}'
      })
      
      return tableRTF
    }

    // Создаем RTF документ
    let rtfContent = `{\\rtf1\\ansi\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}
{\\*\\generator RTFGenerator 1.0}
\\margl1000\\margr1000\\margt1000\\margb1000
\\f0\\fs24
`

    // Колонтитулы
    rtfContent += `{\\header\\pard\\qc ${addImageToRTF(headerBuffer, 12000, 1000)}\\par}
{\\footer\\pard\\qc ${addImageToRTF(footerBuffer, 12000, 800)}\\par}
`

    // Заголовок документа
    rtfContent += `\\qc\\b\\fs32 ${toUnicodeRTF('ТЕХНИЧЕСКОЕ КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ')}\\b0\\fs24\\par\\par`
    rtfContent += `\\qc\\b\\fs28 ${toUnicodeRTF(`№ ${proposal.id.slice(0, 8).toUpperCase()}`)}\\b0\\fs24\\par\\par`
    rtfContent += `\\b ${toUnicodeRTF('Название:')} \\b0 ${toUnicodeRTF(proposal.title)}\\par`
    rtfContent += `\\b ${toUnicodeRTF('Описание:')} \\b0 ${toUnicodeRTF(proposal.description || 'Не указано')}\\par`
    rtfContent += `\\b ${toUnicodeRTF('Дата создания:')} \\b0 ${toUnicodeRTF(new Date(proposal.created_at).toLocaleDateString('ru-RU'))}\\par\\par`

    // Для каждого вентилятора
    for (const [index, fan] of proposal.proposal_fans.entries()) {
      const fanData = fan.fan_data
      const require = fanData.require || {}

      if (index > 0) {
        rtfContent += `\\sect\\sbkpage`
      }

      // Заголовок вентилятора
      rtfContent += `\\qc\\b\\fs28 ${toUnicodeRTF(`ВЕНТИЛЯТОР ${index + 1}`)}\\b0\\fs24\\par\\par`
      rtfContent += `\\qc\\b\\fs24 ${toUnicodeRTF(`Модель: ${fanData['Модель колеса'] || 'Не указана'}`)}\\b0\\fs24\\par\\par`

      // Заданные значения
      rtfContent += `\\b\\fs20 ${toUnicodeRTF('ЗАДАННЫЕ ПАРАМЕТРЫ')}\\b0\\fs24\\par\\par`
      
      const requiredValues = [
        [
          { text: 'Производительность', bold: true, fillColor: true },
          { text: `${require.flow_rate || 'Н/Д'} м³/ч` }
        ],
        [
          { text: 'Давление', bold: true, fillColor: true },
          { text: `${require.pressure || 'Н/Д'} Па` }
        ],
        [
          { text: 'Тип вентилятора', bold: true, fillColor: true },
          { text: require.type || 'Н/Д' }
        ],
        [
          { text: 'Исполнение', bold: true, fillColor: true },
          { text: require.execution || 'Н/Д' }
        ],
        [
          { text: 'Температура', bold: true, fillColor: true },
          { text: `${require.temperature || 'Н/Д'} °C` }
        ]
      ]

      rtfContent += createTableRTF(requiredValues) + '\\par\\par'

      // Результаты подбора
      rtfContent += `\\b\\fs20 ${toUnicodeRTF('РЕЗУЛЬТАТЫ ПОДБОРА')}\\b0\\fs24\\par\\par`

      const technicalData = [
        [
          { text: 'Фактическая производительность', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.x || 'Н/Д'} м³/ч` }
        ],
        [
          { text: 'Фактическое давление', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.y || 'Н/Д'} Па` }
        ],
        [
          { text: 'Мощность', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.power || 'Н/Д'} кВт` }
        ],
        [
          { text: 'КПД', bold: true, fillColor: true },
          { text: `${fanData.crossPoint?.[0]?.kpd || 'Н/Д'} %` }
        ],
        [
          { text: 'Скорость вращения', bold: true, fillColor: true },
          { text: `${fanData.speed || 'Н/Д'} об/мин` }
        ],
        [
          { text: 'Количество', bold: true, fillColor: true },
          { text: `${fan.quantity || 1} шт.` }
        ]
      ]

      rtfContent += createTableRTF(technicalData) + '\\par\\par'

      // График
      if (fanData.graph?.graph?.base64) {
        rtfContent += `\\b\\fs20 ${toUnicodeRTF('АЭРОДИНАМИЧЕСКАЯ ХАРАКТЕРИСТИКА')}\\b0\\fs24\\par\\par`
        try {
          const imageBuffer = base64ToArrayBuffer(fanData.graph.graph.base64)
          if (imageBuffer) {
            rtfContent += addImageToRTF(imageBuffer, 6000, 9000) + '\\par\\par'
          }
        } catch (error) {
          console.error('Ошибка добавления графика:', error)
        }
        rtfContent += `\\qc\\i ${toUnicodeRTF(`Вентилятор: ${fanData['Модель колеса']}, скорость вращения: ${fanData.speed} об/мин`)}\\i0\\par\\par`
      }

      // Примечание
      if (require.notice) {
        rtfContent += `\\b ${toUnicodeRTF('Примечание:')} \\b0 ${toUnicodeRTF(require.notice)}\\par\\par`
      }

      // Чертеж на новой странице
      rtfContent += `\\page\\qc\\b\\fs28 ${toUnicodeRTF('ГАБАРИТНО-ПРИСОЕДИНИТЕЛЬНЫЕ РАЗМЕРЫ')}\\b0\\fs24\\par\\par`

      if (blueprintBuffer) {
        rtfContent += addImageToRTF(blueprintBuffer, 6000, 9000) + '\\par\\par'
        rtfContent += `\\qc\\i ${toUnicodeRTF('Пример чертежа - окончательный чертеж будет предоставлен после подтверждения заказа')}\\i0\\par\\par`
      }

      // Технические характеристики
      const dimensionsData = [
        [
          { text: 'Габаритные размеры', bold: true, fillColor: true },
          { text: 'Будут указаны в рабочих чертежах' }
        ],
        [
          { text: 'Присоединительные размеры', bold: true, fillColor: true },
          { text: 'Согласно технической документации' }
        ],
        [
          { text: 'Масса', bold: true, fillColor: true },
          { text: fanData['Масса, кг'] ? `${fanData['Масса, кг']} кг` : 'Уточняется при заказе' }
        ]
      ]

      rtfContent += createTableRTF(dimensionsData) + '\\par\\par'
    }

    // Завершаем RTF документ
    rtfContent += '}'

    // Создаем и скачиваем файл
    const blob = new Blob([rtfContent], { 
      type: 'application/rtf;charset=windows-1251' 
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ТКП_${proposal.title}_${new Date().toISOString().slice(0, 10)}.rtf`
    document.body.appendChild(link)
    link.click()
    
    // Очистка
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
  } catch (error) {
    console.error('Ошибка генерации RTF:', error)
    alert('Ошибка при генерации RTF файла')
  } finally {
    isGeneratingRTF.value = false
  }
}
</script>

<style scoped>
.parameters-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.parameter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.parameter-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
}

.parameter-value {
  font-weight: 600;
  color: #1976d2;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}
</style>