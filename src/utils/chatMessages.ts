// 消息列表的渲染项构造（纯函数，无 store 依赖，便于单测）。
//
// store 内 messages[sessionId] 已约定为【升序（旧→新）】存储，故本模块只需顺序遍历。
// 产出「日期分隔项」与「连续消息分组标记」：
//   - 日期分隔：跨天处插入 今天 / 昨天 / 10月3日
//   - 分组：同一发送者且间隔不超过 5 分钟视为一组，组内仅首条渲染头像与昵称
import type { MessageDto } from '@/stores/chat';
import { chatDayLabel, toMillis } from '@/utils/format';

/** 连续消息分组的最大间隔：超过则重新显示头像与昵称 */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** 渲染项：判别联合，模板按 kind 收窄后可直接取 label / message */
export type MessageRow =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'message';
      key: string;
      message: MessageDto;
      /** 组内首条：渲染头像与昵称 */
      isGroupStart: boolean;
      /** 组内末条：气泡尾部圆角收口、显示时间 */
      isGroupEnd: boolean;
    };

/**
 * 把升序消息数组转换为带日期分隔与分组标记的渲染项。
 * @param messages 升序（旧→新）消息数组
 */
export function groupMessages(messages: MessageDto[]): MessageRow[] {
  const rows: MessageRow[] = [];
  let lastDayLabel = '';

  messages.forEach((message, index) => {
    const at = toMillis(message.sentTime as string | number | undefined);

    const dayLabel = chatDayLabel(at || undefined);
    if (dayLabel && dayLabel !== lastDayLabel) {
      lastDayLabel = dayLabel;
      rows.push({ kind: 'day', key: `day-${index}`, label: dayLabel });
    }

    const prev = messages[index - 1];
    const next = messages[index + 1];
    // 同一发送者 + 间隔在窗口内 → 与相邻消息同组（首尾分别决定是否显示头像/收口圆角）
    const sameAsPrev = !!prev
      && prev.senderId === message.senderId
      && at - toMillis(prev.sentTime as string | number | undefined) <= GROUP_WINDOW_MS;
    const sameAsNext = !!next
      && next.senderId === message.senderId
      && toMillis(next.sentTime as string | number | undefined) - at <= GROUP_WINDOW_MS;

    rows.push({
      kind: 'message',
      key: message.messageId || `message-${index}`,
      message,
      isGroupStart: !sameAsPrev,
      isGroupEnd: !sameAsNext
    });
  });

  return rows;
}