<script lang="ts" setup>
import { Place } from "@/types/baseTypes";

defineProps<{
  place: Place;
}>();

function formatDate(date: Date | string) {
  if (typeof date === "string") {
    date = new Date(date);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  console.log(year);
  return `${year}-${month}-${day}`;
}
</script>

<template>
  <div class="place-inline">
    <button
      class="saveButton"
      style="display: flex; margin-left: auto; color: black"
    >
      save
    </button>
    <div class="place-title">
      <div style="font-size: large; font-weight: bold; margin-top: auto">
        {{ place.name }}
      </div>
    </div>
    <div style="font-size: x-small; font-weight: lighter">
      {{ place.source }} - <a :href="place.link" target="_blank"> link </a>
    </div>
    <div>Category : {{ place.category }}</div>
    <div>Address : {{ place.address }}</div>
    <div>Description : {{ place.description }}</div>
    <div>
      Date Accessed :
      {{ place.dateAccessed ? formatDate(place.dateAccessed) : "No date" }}
    </div>
  </div>
</template>

<style>
.place-inline {
  width: auto; /* Adjust width as needed */
  padding: 10px;
  margin: 20px auto; /* Centers the box horizontally */
  background-color: #f9f9f9; /* Light gray background */
  border-radius: 8px; /* Rounded corners */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Soft shadow */
  color: #333; /* Dark gray text color */
  text-align: left;
}

.place-inline p {
  margin: 10px 0;
  margin-left: 0;
}

.saveButton {
  background-color: aqua;
}
</style>
