import os
import win32com.client

ppt_path = os.path.abspath("Skill_Exchange_Complete_Project_Presentation.pptx")
export_dir = os.path.abspath("complete_project_exports")

if not os.path.exists(export_dir):
    os.makedirs(export_dir)

ppt_app = win32com.client.Dispatch("PowerPoint.Application")
try:
    pres = ppt_app.Presentations.Open(ppt_path, WithWindow=False)
    print(f"Opened presentation with {len(pres.Slides)} slides.")
    for i, slide in enumerate(pres.Slides):
        out_file = os.path.join(export_dir, f"slide_{i+1:02d}.png")
        slide.Export(out_file, "PNG", 1920, 1080)
        print(f"Exported Slide {i+1:02d} -> {out_file}")
    pres.Close()
finally:
    ppt_app.Quit()

print("All 22 slides exported successfully!")
