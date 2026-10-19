<script lang="ts">
  let { start = 0 }: { start?: number } = $props();
  let count = $state(start);
</script>

<button class="px-3 py-1 bg-obs-accent text-white rounded" onclick={() => count++}>
  Clicks: {count}
</button>