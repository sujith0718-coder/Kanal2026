#!/bin/bash
echo "Testing Quiz Endpoint..."
curl -s -X POST http://localhost:3099/api/ai/quiz \
  -H "Content-Type: application/json" \
  -d '{"topic":"Binary Search Trees","subject":"Data Structures","numQuestions":2}' | python3 -m json.tool

echo -e "\n\nTesting Explain Endpoint..."
curl -s -X POST http://localhost:3099/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"type": "plan", "subject": "Data Structures", "score": 78, "factors": {"examUrgency": 85, "remainingSyllabus": 70, "masteryGap": 80, "difficulty": 75}, "examDate": "2026-10-05", "daysUntilExam": 6}' | python3 -m json.tool

echo -e "\n\nTesting Extract Endpoint..."
curl -s -X POST http://localhost:3099/api/ai/extract \
  -H "Content-Type: application/json" \
  -d '{"documentName": "semester_exam_schedule.txt", "textContent": "SEMESTER EXAM SCHEDULE - Fall 2026\n\n1. Data Structures - Oct 5, 2026, 9:00 AM - 12:00 PM\n2. Algorithms - Oct 8, 2026, 2:00 PM - 5:00 PM"}' | python3 -m json.tool
