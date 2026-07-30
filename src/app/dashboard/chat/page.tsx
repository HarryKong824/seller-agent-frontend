'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useQueryClient } from '@tanstack/react-query';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateSession,
  useDeleteSession,
  useRenameSession,
  useSession,
  useSessions,
  sendMessage,
  sendMessageStream,
  suggestScripts
} from '@/features/chat/api';
import type {
  ChatSource,
  MessageResponse,
  SessionResponse
} from '@/features/chat/types';
import { useKnowledgeBases } from '@/features/knowledge/api';

export default function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createKbId, setCreateKbId] = useState<string>('none');
  const [renameTarget, setRenameTarget] = useState<SessionResponse | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SessionResponse | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<ChatSource[]>([]);
  const [streamingQuery, setStreamingQuery] = useState('');

  const queryClient = useQueryClient();
  const { data, isLoading } = useSessions();
  const { data: kbData } = useKnowledgeBases();
  const { data: sessionData, isLoading: sessionLoading } = useSession(selectedSessionId);
  const createMutation = useCreateSession();
  const renameMutation = useRenameSession();
  const deleteMutation = useDeleteSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionData?.messages, isStreaming, streamingContent]);

  const handleCreate = async () => {
    try {
      const kbId = createKbId !== 'none' ? Number(createKbId) : undefined;
      const session = await createMutation.mutateAsync({
        title: createTitle.trim() || undefined,
        kbId
      });
      toast.success('会话创建成功');
      setCreateOpen(false);
      setCreateTitle('');
      setCreateKbId('none');
      setSelectedSessionId(session.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败');
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    if (!renameTitle.trim()) {
      toast.error('标题不能为空');
      return;
    }
    try {
      await renameMutation.mutateAsync({
        sessionId: renameTarget.id,
        title: renameTitle.trim()
      });
      toast.success('重命名成功');
      setRenameTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '重命名失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    try {
      await deleteMutation.mutateAsync(targetId);
      toast.success('会话已删除');
      if (selectedSessionId === targetId) {
        setSelectedSessionId(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleSend = async () => {
    if (!selectedSessionId || !input.trim()) return;
    const query = input.trim();
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingSources([]);
    setStreamingQuery(query);

    // Try streaming first
    let streamOk = false;
    try {
      await sendMessageStream(selectedSessionId, { query }, (event) => {
        if (event.type === 'token' && event.delta) {
          setStreamingContent((prev) => prev + event.delta!);
        } else if (event.type === 'sources' && event.sources) {
          setStreamingSources(event.sources);
        } else if (event.type === 'error') {
          toast.error(typeof event.message === 'string' ? event.message : '生成失败，请稍后重试');
        }
      });
      streamOk = true;
      queryClient.invalidateQueries({
        queryKey: ['chat-session', selectedSessionId]
      });
    } catch {
      // stream failed, will fallback
    }

    // Fallback to non-streaming on failure
    if (!streamOk) {
      try {
        await sendMessage(selectedSessionId, { query });
        queryClient.invalidateQueries({
          queryKey: ['chat-session', selectedSessionId]
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '发送失败');
        setInput(query);
      }
    }

    setIsStreaming(false);
  };

  return (
    <div className='flex h-[calc(100vh-4rem)] flex-row overflow-hidden'>
      {/* 会话侧栏 */}
      <div className='flex w-72 shrink-0 flex-col border-r'>
        <div className='flex items-center justify-between border-b p-3'>
          <span className='font-semibold'>会话列表</span>
          <Button size='sm' variant='outline' onClick={() => setCreateOpen(true)}>
            <Icons.add className='mr-1 size-4' />
            新建
          </Button>
        </div>
        <ScrollArea className='flex-1'>
          {isLoading ? (
            <div className='flex h-32 items-center justify-center'>
              <Icons.spinner className='text-muted-foreground size-5 animate-spin' />
            </div>
          ) : data?.items?.length ? (
            <div className='flex flex-col'>
              {data.items.map((session) => (
                <button
                  type='button'
                  key={session.id}
                  aria-label={`选择会话 ${session.title || session.id}`}
                  className={`group flex w-full cursor-pointer items-center justify-between border-b px-3 py-2.5 text-left hover:bg-accent ${
                    selectedSessionId === session.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <div className='min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium'>
                      {session.title || `会话 #${session.id}`}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {format(new Date(session.createdAt), 'MM-dd HH:mm')}
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(session);
                        setRenameTitle(session.title || '');
                      }}
                    >
                      <Icons.edit className='size-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='size-7'
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(session);
                      }}
                    >
                      <Icons.trash className='size-3.5' />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground flex h-32 items-center justify-center text-sm'>
              暂无会话，点击右上角新建
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 消息区域 */}
      {selectedSessionId === null ? (
        <div className='flex flex-1 items-center justify-center'>
          <div className='text-muted-foreground text-center'>
            <Icons.chat className='mx-auto mb-2 size-12 opacity-30' />
            <p className='text-sm'>请选择或创建会话</p>
          </div>
        </div>
      ) : (
        <div className='flex flex-1 flex-col'>
          {/* 消息列表 */}
          <div className='flex-1 overflow-y-auto'>
            <div className='mx-auto max-w-3xl space-y-4 p-4'>
              {sessionLoading ? (
                <div className='flex h-32 items-center justify-center'>
                  <Icons.spinner className='text-muted-foreground size-5 animate-spin' />
                </div>
              ) : sessionData?.messages?.length ? (
                <>
                  {sessionData.messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {isStreaming && (
                    <>
                      <MessageBubble
                        msg={{
                          id: -2,
                          sessionId: selectedSessionId,
                          role: 'user',
                          content: streamingQuery,
                          sources: null,
                          kbId: null,
                          createdAt: new Date().toISOString(),
                          suggestedScripts: null
                        }}
                      />
                      <MessageBubble
                        msg={{
                          id: -1,
                          sessionId: selectedSessionId,
                          role: 'assistant',
                          content: streamingContent || '...',
                          sources:
                            streamingSources.length > 0 ? streamingSources : null,
                          kbId: null,
                          createdAt: new Date().toISOString(),
                          suggestedScripts: null
                        }}
                      />
                    </>
                  )}
                </>
              ) : (
                <div className='text-muted-foreground flex h-32 items-center justify-center text-sm'>
                  开始对话吧
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 发送框 */}
          <div className='border-t p-4'>
            <div className='mx-auto flex max-w-3xl gap-2'>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder='输入消息，Enter 发送，Shift+Enter 换行'
                disabled={isStreaming}
                rows={1}
                className='min-h-[40px] max-h-[120px] flex-1 resize-none'
              />
              <Button
                onClick={handleSend}
                disabled={isStreaming || !input.trim()}
                size='icon'
              >
                {isStreaming ? (
                  <Icons.spinner className='size-4 animate-spin' />
                ) : (
                  <Icons.send className='size-4' />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 新建会话 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>新建会话</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='session-title'>标题（可选）</Label>
              <Input
                id='session-title'
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder='如：产品咨询'
              />
            </div>
            <div className='space-y-2'>
              <Label>关联知识库</Label>
              <Select
                value={createKbId}
                onValueChange={(v) => setCreateKbId(v ?? 'none')}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>不关联</SelectItem>
                  {kbData?.items?.map((kb) => (
                    <SelectItem key={kb.id} value={String(kb.id)}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名 Dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
          </DialogHeader>
          <div className='space-y-2 py-4'>
            <Label htmlFor='rename-title'>会话标题</Label>
            <Input
              id='rename-title'
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setRenameTarget(null)}>
              取消
            </Button>
            <Button onClick={handleRename} disabled={renameMutation.isPending}>
              {renameMutation.isPending && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className='sm:max-w-[400px]'>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除会话&ldquo;
              {deleteTarget?.title || `#${deleteTarget?.id}`}
              &rdquo;吗？所有消息将被一并删除，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='bg-destructive text-white hover:bg-destructive/90'
            >
              {deleteMutation.isPending && (
                <Icons.spinner className='mr-1 size-4 animate-spin' />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** 消息气泡组件：user 右对齐主色，assistant 左对齐灰色。 */
function MessageBubble({ msg }: { msg: MessageResponse }) {
  const isUser = msg.role === 'user';
  const [scripts, setScripts] = useState<string[] | null>(
    msg.suggestedScripts ?? null
  );
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    try {
      const res = await suggestScripts(msg.sessionId, msg.id);
      setScripts(res.suggestedScripts ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '获取推荐话术失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className='whitespace-pre-wrap text-sm'>{msg.content}</div>
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <SourcesAccordion sources={msg.sources} />
        )}
        {!isUser && (
          <div className='mt-2 border-t border-border/30 pt-2'>
            {scripts && scripts.length > 0 && (
              <div className='mb-2 space-y-1'>
                {scripts.map((s, i) => (
                  <div key={i} className='text-xs opacity-80'>
                    💡 {s}
                  </div>
                ))}
              </div>
            )}
            <Button
              size='sm'
              variant='ghost'
              className='h-6 px-2 text-xs'
              onClick={() => void handleSuggest()}
              disabled={loading}
            >
              {loading ? '生成中…' : '💡 推荐话术'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 引用来源折叠列表：每个 source 可展开查看分块摘要。 */
function SourcesAccordion({ sources }: { sources: ChatSource[] }) {
  return (
    <div className='mt-2 border-t border-border/30 pt-2'>
      <div className='mb-1 text-xs opacity-70'>引用来源</div>
      <Accordion className='w-full'>
        {sources.map((src, i) => (
          <AccordionItem key={i} value={`src-${i}`}>
            <AccordionTrigger className='text-xs hover:no-underline'>
              <span className='flex items-center gap-1'>
                <span className='font-mono'>[{i + 1}]</span>
                <span>{src.source || `文档#${src.doc_id}`}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <pre className='text-xs whitespace-pre-wrap'>{src.snippet}</pre>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}