"use client";
import { createContext } from "react";

// Lets the daily chart (ReviewInsights) tell the review queue which day to focus
// its "อนุมัติแล้ว" section on when a bar is clicked. `nonce` changes on every
// pick so re-clicking the same day still re-triggers the jump.
export const ReviewDayContext = createContext<{ day?: string; nonce?: number }>({});
