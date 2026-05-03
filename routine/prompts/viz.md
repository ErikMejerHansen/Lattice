# Viz prompt

System: (see CLAUDE.md system prompt section)

User:

Generate an interactive HTML visualization for a lesson on: {topic}
Lesson title: {lessonTitle}
Section: {sectionHeading}

Context (prose preceding the viz in the section):
{prosePreceding}

Return a complete, self-contained HTML file. No explanation, no markdown fence — raw HTML only.

Hard requirements:
1. Begin the <style> block with the required CSS preamble verbatim (see routine/CLAUDE.md).
2. Root element: <div id="viz"> directly inside <body>.
3. One CDN library maximum (D3 from cdnjs default; three.js for 3D; plotly only if a built-in chart fits exactly).
   CDN: cdnjs.cloudflare.com only.
4. Exactly one interactive element (slider, drag handle, toggle, clickable region).
   Two only if the topic genuinely requires two parameters.
5. Include <div class="viz-caption"> explaining what the user is looking at.
6. No localStorage, no fetch, no setInterval > 30s, no window resize listener.
7. Mobile-friendly: touch targets >= 36px, sliders not tiny drag handles.
8. Specific to THIS lesson: not a generic sine wave or bar chart.
   The interaction must illuminate the concept being taught.
9. File must be under 30KB.
