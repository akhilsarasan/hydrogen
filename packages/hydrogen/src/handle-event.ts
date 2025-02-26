import {EntryServerHandler} from './types';
import type {ServerResponse} from 'http';
import type {ServerComponentRequest} from './framework/Hydration/ServerComponentRequest.server';
import {getCacheControlHeader} from './framework/cache';
import {setContext, setCache, RuntimeContext} from './framework/runtime';
import {setConfig} from './framework/config';

interface HydrogenFetchEvent {
  /**
   * Hydrogen only cares about a single property, since we pass `request` as a separate option.
   */
  waitUntil?: (callback: Promise<void>) => void;
}

export interface HandleEventOptions {
  request: ServerComponentRequest;
  entrypoint: any;
  indexTemplate: string | ((url: string) => Promise<string>);
  assetHandler?: (event: HydrogenFetchEvent, url: URL) => Promise<Response>;
  cache?: Cache;
  streamableResponse: ServerResponse;
  dev?: boolean;
  context?: RuntimeContext;
}

export default async function handleEvent(
  event: HydrogenFetchEvent,
  {
    request,
    entrypoint,
    indexTemplate,
    assetHandler,
    streamableResponse,
    dev,
    cache,
    context,
  }: HandleEventOptions
) {
  const url = new URL(request.url);

  /**
   * Inject the cache & context into the module loader so we can pull it out for subrequests.
   */
  setCache(cache);
  setContext(context);
  setConfig({dev});

  const isReactHydrationRequest = url.pathname === '/react';

  const template =
    typeof indexTemplate === 'function'
      ? await indexTemplate(url.toString())
      : indexTemplate;

  /**
   * If this is a request for an asset, and an asset handler is present, call it.
   */
  if (
    /\.(png|jpe?g|gif|css|js|svg|ico|map)$/i.test(url.pathname) &&
    assetHandler
  ) {
    return assetHandler(event, url);
  }
  const {render, hydrate, stream}: EntryServerHandler =
    entrypoint.default || entrypoint;

  // @ts-ignore
  if (dev && !(render && hydrate && stream)) {
    throw new Error(
      `entry-server.jsx could not be loaded. This likely occurred because of a Vite compilation error.\n` +
        `Please check your server logs for more information.`
    );
  }

  const isStreamable = streamableResponse && isStreamableRequest(url);

  /**
   * Stream back real-user responses, but for bots/etc,
   * use `render` instead. This is because we need to inject <head>
   * things for SEO reasons.
   */
  if (isStreamable) {
    if (isReactHydrationRequest) {
      hydrate(url, {context: {}, request, response: streamableResponse, dev});
    } else {
      stream(url, {
        context: {},
        request,
        response: streamableResponse,
        template,
        dev,
      });
    }
    return;
  }

  const {body, bodyAttributes, htmlAttributes, componentResponse, ...head} =
    await render(url, {request, context: {}, isReactHydrationRequest, dev});

  const headers = componentResponse.headers;

  /**
   * TODO: Also add `Vary` headers for `accept-language` and any other keys
   * we want to shard our full-page cache for all Hydrogen storefronts.
   */
  headers.set(
    getCacheControlHeader({dev}),
    componentResponse.cacheControlHeader
  );

  if (componentResponse.customBody) {
    return new Response(await componentResponse.customBody, {
      status: componentResponse.status ?? 200,
      headers,
    });
  }

  let response;

  if (isReactHydrationRequest) {
    response = new Response(body, {
      status: componentResponse.status ?? 200,
      headers,
    });
  } else {
    const html = template
      .replace(
        `<div id="root"></div>`,
        `<div id="root" data-server-rendered="true">${body}</div>`
      )
      .replace(/<head>(.*?)<\/head>/s, generateHeadTag(head))
      .replace('<body', bodyAttributes ? `<body ${bodyAttributes}` : '$&')
      .replace('<html', htmlAttributes ? `<html ${htmlAttributes}` : '$&');

    headers.append('content-type', 'text/html');

    response = new Response(html, {
      status: componentResponse.status ?? 200,
      headers,
    });
  }

  return response;
}

function isStreamableRequest(url: URL) {
  /**
   * TODO: Add UA detection.
   */
  const isBot = url.searchParams.has('_bot');

  return !isBot;
}

/**
 * Generate the contents of the `head` tag, and update the existing `<title>` tag
 * if one exists, and if a title is passed.
 */
function generateHeadTag(head: Record<string, string>) {
  const headProps = ['base', 'meta', 'style', 'noscript', 'script', 'link'];
  const {title, ...rest} = head;

  const otherHeadProps = headProps
    .map((prop) => rest[prop])
    .filter(Boolean)
    .join('\n');

  return (_outerHtml: string, innerHtml: string) => {
    let headHtml = otherHeadProps + innerHtml;

    if (title) {
      if (headHtml.includes('<title>')) {
        headHtml = headHtml.replace(/(<title>(?:.|\n)*?<\/title>)/, title);
      } else {
        headHtml += title;
      }
    }

    return `<head>${headHtml}</head>`;
  };
}
