<template>
  <v-container>
    <v-card class="pa-6">
      <div class="d-flex justify-space-between align-center mb-6">
        <v-card-title class="text-h4 pa-0">Мои технические предложения</v-card-title>
        <v-btn to="/proposals/new" color="primary" prepend-icon="mdi-plus">
          Новое предложение
        </v-btn>
      </div>

      <v-alert
        v-if="proposalsStore.error"
        type="error"
        class="mb-4"
      >
        {{ proposalsStore.error }}
      </v-alert>

      <v-progress-circular
        v-if="proposalsStore.isLoading"
        indeterminate
        class="d-block mx-auto my-8"
      ></v-progress-circular>

      <v-alert
        v-else-if="proposalsStore.proposals.length === 0"
        type="info"
      >
        У вас пока нет технических предложений. Создайте первое!
      </v-alert>

      <v-row v-else>
        <v-col
          v-for="proposal in proposalsStore.proposals"
          :key="proposal.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card :color="getStatusColor(proposal.status)" variant="outlined">
            <v-card-title class="d-flex justify-space-between align-start">
              <span class="text-h6">{{ proposal.title }}</span>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    v-bind="props"
                    size="small"
                    :color="getStatusColor(proposal.status)"
                  >
                    <v-icon>mdi-circle</v-icon>
                  </v-btn>
                </template>
                <v-list>
                  <v-list-item
                    v-for="status in statusOptions"
                    :key="status.value"
                    @click="updateProposalStatus(proposal.id, status.value)"
                  >
                    <v-list-item-title>
                      <v-icon :color="status.color" class="mr-2">mdi-circle</v-icon>
                      {{ status.text }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-title>

            <v-card-text>
              <div class="mb-2">
                <v-chip
                  :color="getStatusColor(proposal.status)"
                  size="small"
                  class="mb-2"
                >
                  <v-icon start>mdi-circle</v-icon>
                  {{ getStatusText(proposal.status) }}
                </v-chip>
              </div>

              <p class="text-body-2 mb-2">
                {{ proposal.description || 'Описание отсутствует' }}
              </p>

              <p class="text-caption text-grey">
                Создано: {{ formatDate(proposal.created_at) }}
              </p>

              <p class="text-caption text-grey" v-if="proposal.updated_at">
                Обновлено: {{ formatDate(proposal.updated_at) }}
              </p>
            </v-card-text>

            <v-card-actions>
              <v-btn
                :to="{ name: 'proposal-detail', params: { id: proposal.id } }"
                variant="text"
                color="primary"
                size="small"
              >
                Подробнее
              </v-btn>

              <v-spacer></v-spacer>

              <v-btn
                icon
                color="error"
                size="small"
                @click="deleteProposal(proposal.id)"
                :loading="proposalsStore.isLoading"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProposalsStore } from '@/stores/proposals'

const proposalsStore = useProposalsStore()

// Опции статусов
const statusOptions = [
  { value: 'draft', text: 'Черновик', color: 'grey' },
  { value: 'in_progress', text: 'В работе', color: 'orange' },
  { value: 'completed', text: 'Завершено', color: 'green' }
]

onMounted(async () => {
  await proposalsStore.fetchProposals()
})

// Получение текста статуса
const getStatusText = (status) => {
  const found = statusOptions.find(opt => opt.value === status)
  return found ? found.text : status
}

// Получение цвета статуса
const getStatusColor = (status) => {
  const found = statusOptions.find(opt => opt.value === status)
  return found ? found.color : 'grey'
}

// Форматирование даты
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Обновление статуса
const updateProposalStatus = async (proposalId, status) => {
  try {
    await proposalsStore.updateProposalStatus(proposalId, status)
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
  }
}

// Удаление предложения
const deleteProposal = async (id) => {
  if (confirm('Вы уверены, что хотите удалить это предложение?')) {
    try {
      await proposalsStore.deleteProposal(id)
    } catch (error) {
      console.error('Ошибка удаления:', error)
    }
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>