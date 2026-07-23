<script setup lang="ts">
import { useData } from "vitepress";
import { computed } from "vue";

const { page } = useData();

const crumbs = computed(() => {
  if (!page.value.relativePath.startsWith("blog/posts/")) {
    return null;
  }
  return [{ text: "Blog", link: "/blog/" }, { text: page.value.title }];
});
</script>

<template>
  <nav v-if="crumbs" class="breadcrumbs" aria-label="Breadcrumb">
    <template v-for="(crumb, index) of crumbs" :key="index">
      <span v-if="index > 0" class="separator" aria-hidden="true">/</span>
      <a v-if="crumb.link" class="crumb-link" :href="crumb.link">
        {{ crumb.text }}
      </a>
      <span v-else class="crumb-current" aria-current="page">
        {{ crumb.text }}
      </span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.separator {
  color: var(--vp-c-text-3);
}

.crumb-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.crumb-link:hover {
  text-decoration: underline;
}

.crumb-current {
  color: var(--vp-c-text-2);
}
</style>
