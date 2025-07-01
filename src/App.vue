<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const showNavRoutes = ['home', 'businessList', 'mine', 'payment', 'orderList']

const showNav = computed(() => {
  return showNavRoutes.includes(route.name as string)
})

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <RouterView></RouterView>
</template>

<style scoped>

</style>