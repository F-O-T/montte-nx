import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import {
   EditorContent,
   type EditorOptions,
   type Storage,
   useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type React from "react";
import { useEffect, useMemo } from "react";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";

export interface TiptapEditorProps {
   value: string;
   onChange: (value: string) => void;
   onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
   name?: string;
   id?: string;
   placeholder?: string;
   className?: string;
   minHeight?: string;
   editorOptions?: Partial<EditorOptions>;
   error?: boolean;
}
type MDStorage = Storage & {
   markdown?: MarkdownStorage;
};
export function TiptapEditor({
   value,
   onChange,
   onBlur,
   name,
   id,
   placeholder,
   className = "",
   minHeight = "200px",
   editorOptions = {},
   error = false,
}: TiptapEditorProps) {
   const editor = useEditor({
      content: value,
      editorProps: {
         attributes: {
            class: `prose prose-sm max-w-none focus:outline-none p-4 ${className} ${
               error ? "border-destructive" : ""
            }`,
            style: `min-height: ${minHeight};`,
         },
      },
      extensions: [StarterKit, Markdown],
      immediatelyRender: false,

      onUpdate: ({ editor }) => {
         const markdownStorage = (editor.storage as MDStorage).markdown;
         if (markdownStorage?.getMarkdown) {
            onChange(markdownStorage.getMarkdown());
         } else {
            onChange(editor.getText()); // fallback to plain text
         }
      },
      ...editorOptions,
   });

   // Sync editor content if value changes externally
   useEffect(() => {
      if (editor && value !== editor.getText() && editor.isEmpty) {
         editor.commands.setContent(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [value, editor]);

   const toolbarButtons = useMemo(
      () => [
         {
            as: Button,
            isActive: () => editor?.isActive("bold"),
            key: "bold",
            label: <strong>B</strong>,
            onClick: () => editor?.chain().focus().toggleBold().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("bold") ? "secondary" : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("italic") ?? false,
            key: "italic",
            label: <em>I</em>,
            onClick: () => editor?.chain().focus().toggleItalic().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("italic") ? "secondary" : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("strike") ?? false,
            key: "strike",
            label: <s>S</s>,
            onClick: () => editor?.chain().focus().toggleStrike().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("strike") ? "secondary" : "ghost",
         },
         { key: "sep-1", separator: true },
         {
            as: Button,
            isActive: () => editor?.isActive("heading", { level: 1 }) ?? false,
            key: "heading-1",
            label: "H1",
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 1 }).run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("heading", { level: 1 })
               ? "secondary"
               : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("heading", { level: 2 }) ?? false,
            key: "heading-2",
            label: "H2",
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 2 }).run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("heading", { level: 2 })
               ? "secondary"
               : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("heading", { level: 3 }) ?? false,
            key: "heading-3",
            label: "H3",
            onClick: () =>
               editor?.chain().focus().toggleHeading({ level: 3 }).run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("heading", { level: 3 })
               ? "secondary"
               : "ghost",
         },
         { key: "sep-2", separator: true },
         {
            as: Button,
            isActive: () => editor?.isActive("bulletList") ?? false,
            key: "bulletList",
            label: "•",
            onClick: () => editor?.chain().focus().toggleBulletList().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("bulletList") ? "secondary" : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("orderedList") ?? false,
            key: "orderedList",
            label: "1.",
            onClick: () => editor?.chain().focus().toggleOrderedList().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("orderedList") ? "secondary" : "ghost",
         },
         { key: "sep-3", separator: true },
         {
            as: Button,
            isActive: () => editor?.isActive("blockquote") ?? false,
            key: "blockquote",
            label: '"',
            onClick: () => editor?.chain().focus().toggleBlockquote().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("blockquote") ? "secondary" : "ghost",
         },
         {
            as: Button,
            isActive: () => editor?.isActive("code") ?? false,
            key: "code",
            label: "<>",
            onClick: () => editor?.chain().focus().toggleCode().run(),
            size: "sm",
            type: "button",
            variant: editor?.isActive("code") ? "secondary" : "ghost",
         },
         { key: "sep-4", separator: true },
         {
            as: Button,
            disabled: !editor?.can().undo(),
            isActive: () => false,
            key: "undo",
            label: "↶",
            onClick: () => editor?.chain().focus().undo().run(),
            size: "sm",
            type: "button",
            variant: "ghost",
         },
         {
            as: Button,
            disabled: !editor?.can().redo(),
            isActive: () => false,
            key: "redo",
            label: "↷",
            onClick: () => editor?.chain().focus().redo().run(),
            size: "sm",
            type: "button",
            variant: "ghost",
         },
      ],
      [editor],
   );

   if (!editor) return <div>Loading editor...</div>;

   return (
      <div
         className={`rounded-lg border-2 ${error ? "border-destructive" : "border-primary/30"} bg-muted/70`}
      >
         <div className="p-2 flex flex-wrap items-center gap-1 bg-primary/10">
            {toolbarButtons.map((btn) =>
               btn.separator ? (
                  <div className="w-px h-6 bg-primary mx-1" key={btn.key} />
               ) : (
                  <Button
                     disabled={btn.disabled}
                     key={btn.key}
                     onClick={btn.onClick}
                     size={
                        btn.size as
                           | "default"
                           | "icon"
                           | "lg"
                           | "sm"
                           | null
                           | undefined
                     }
                     type={
                        btn.type as "button" | "submit" | "reset" | undefined
                     }
                     variant={
                        btn.variant as
                           | "default"
                           | "link"
                           | "outline"
                           | "destructive"
                           | "ghost"
                           | "secondary"
                           | null
                           | undefined
                     }
                  >
                     {btn.label}
                  </Button>
               ),
            )}
         </div>
         <div className=" relative rounded-b-lg" style={{ minHeight }}>
            <EditorContent
               data-name={name}
               data-placeholder={placeholder}
               editor={editor}
               id={id}
               onBlur={onBlur}
            />
            {editor.isEmpty && placeholder && (
               <div
                  className="absolute top-0 left-0 w-full h-full flex flex-col gap-2 items-start p-4 text-muted-foreground pointer-events-none select-none"
                  style={{ zIndex: 1 }}
               >
                  <span>{placeholder}</span>
                  <Separator className="my-2 w-full" />
               </div>
            )}
         </div>
      </div>
   );
}
