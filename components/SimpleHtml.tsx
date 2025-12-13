import React from 'react';
import { Text, StyleSheet, Linking, TextStyle } from 'react-native';
import { COLORS } from '../constants';

interface SimpleHtmlProps {
  html: string;
  baseStyle?: TextStyle;
}

interface ParsedNode {
  type: 'text' | 'strong' | 'a' | 'p' | 'br';
  content?: string;
  href?: string;
  children?: ParsedNode[];
}

function parseHtml(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];

  // Clean up the HTML - normalize whitespace and remove extra breaks
  let cleanHtml = html
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Split by paragraph tags first
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = cleanHtml.match(paragraphRegex);

  if (paragraphs && paragraphs.length > 0) {
    paragraphs.forEach((p, index) => {
      const innerContent = p.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '');
      nodes.push({
        type: 'p',
        children: parseInlineElements(innerContent),
      });
      // Add line break between paragraphs (except last)
      if (index < paragraphs.length - 1) {
        nodes.push({ type: 'br' });
      }
    });
  } else {
    // No paragraph tags, parse as inline content
    nodes.push(...parseInlineElements(cleanHtml));
  }

  return nodes;
}

function parseInlineElements(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];

  // Handle <br> tags
  html = html.replace(/<br\s*\/?>/gi, '\n');

  // Regex to match <strong>, <b>, <a> tags
  const tagRegex = /<(strong|b|a)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    // Add text before this tag
    if (match.index > lastIndex) {
      const textBefore = html.slice(lastIndex, match.index);
      if (textBefore) {
        nodes.push({ type: 'text', content: decodeHtmlEntities(textBefore) });
      }
    }

    const tagName = match[1].toLowerCase();
    const attributes = match[2];
    const innerContent = match[3];

    if (tagName === 'a') {
      const hrefMatch = attributes.match(/href=["']([^"']*)["']/i);
      const href = hrefMatch ? hrefMatch[1] : '';
      nodes.push({
        type: 'a',
        href,
        content: decodeHtmlEntities(innerContent.replace(/<[^>]*>/g, '')),
      });
    } else if (tagName === 'strong' || tagName === 'b') {
      nodes.push({
        type: 'strong',
        content: decodeHtmlEntities(innerContent.replace(/<[^>]*>/g, '')),
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last tag
  if (lastIndex < html.length) {
    const remaining = html.slice(lastIndex);
    if (remaining) {
      nodes.push({ type: 'text', content: decodeHtmlEntities(remaining) });
    }
  }

  return nodes;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function renderNodes(nodes: ParsedNode[], baseStyle?: TextStyle): React.ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return <Text key={index} style={baseStyle}>{node.content}</Text>;

      case 'strong':
        return (
          <Text key={index} style={[baseStyle, styles.strong]}>
            {node.content}
          </Text>
        );

      case 'a':
        return (
          <Text
            key={index}
            style={[baseStyle, styles.link]}
            onPress={() => {
              if (node.href) {
                Linking.openURL(node.href);
              }
            }}
          >
            {node.content}
          </Text>
        );

      case 'p':
        return (
          <Text key={index} style={baseStyle}>
            {node.children ? renderNodes(node.children, baseStyle) : null}
          </Text>
        );

      case 'br':
        return <Text key={index}>{'\n\n'}</Text>;

      default:
        return null;
    }
  });
}

export function SimpleHtml({ html, baseStyle }: SimpleHtmlProps) {
  const nodes = parseHtml(html);

  return (
    <Text style={baseStyle}>
      {renderNodes(nodes, baseStyle)}
    </Text>
  );
}

const styles = StyleSheet.create({
  strong: {
    fontWeight: '700',
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

