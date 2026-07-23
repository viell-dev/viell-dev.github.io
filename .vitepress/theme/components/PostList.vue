<script setup lang="ts">
import { computed } from "vue";

import { data as posts, type PostEntry } from "../posts.data";

const byYear = computed(() => {
  const groups = new Map<number, PostEntry[]>();
  for (const post of posts) {
    const group = groups.get(post.date.year);
    if (group) {
      group.push(post);
    } else {
      groups.set(post.date.year, [post]);
    }
  }
  return [...groups.entries()];
});
</script>

<template>
  <section v-for="[year, entries] of byYear" :key="year" class="year">
    <h2 class="year-heading">{{ year }}</h2>
    <ul class="post-list">
      <li v-for="post of entries" :key="post.href" class="post">
        <time class="post-date" :datetime="post.date.iso">
          {{ post.date.formatted }}
        </time>
        <div class="post-body">
          <a class="post-title" :href="post.href">
            {{ post.title }}
          </a>
          <p v-if="post.description" class="post-description">
            {{ post.description }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.year-heading {
  margin: 32px 0 12px;
  padding: 0;
  border-top: none;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2);
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post {
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 12px 0;
  border-top: 1px solid var(--vp-c-divider);
}

.post-date {
  flex: 0 0 7em;
  padding-top: 1px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.post-body {
  min-width: 0;
}

.post-title {
  font-weight: 600;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.post-title:hover {
  text-decoration: underline;
}

.post-description {
  margin: 4px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

@media (max-width: 519px) {
  .post {
    flex-direction: column;
    gap: 2px;
  }

  .post-date {
    flex: none;
  }
}
</style>
