/**
 * Content resource for the GunSpec SDK.
 *
 * Wraps the public `/v1/blog` and `/v1/changelog` endpoints. Both are readable
 * without an API key, so they can be rendered on a marketing page or status
 * board that has no credential to hand.
 *
 * @module
 */

import { pathSegment } from '../core/path';
import type { HttpClient, APIResponse, PaginatedResponse } from '../core';
import type { BlogPost, ChangelogEntry, PaginationParams, SiteNotice } from '../types';

/** Filters accepted by {@link ContentResource.listChangelog}. */
export interface ListChangelogParams extends PaginationParams {
  /** Restrict to one entry category. */
  category?: 'feature' | 'fix' | 'improvement' | 'data' | 'breaking';
}

/** Filters accepted by {@link ContentResource.listBlogPosts}. */
export interface ListBlogPostsParams extends PaginationParams {
  /** Restrict to one post category. */
  category?: string;
}

/**
 * Resource class for the GunSpec content feeds.
 *
 * Instantiated internally by the {@link GunSpec} client and exposed as
 * `client.content`.
 *
 * @example
 * ```typescript
 * import GunSpec from '@buun_group/gunspec-sdk';
 *
 * const client = new GunSpec();
 *
 * const { data } = await client.content.listChangelog({ category: 'feature' });
 * for (const entry of data) console.log(entry.title, entry.publishedAt);
 * ```
 */
export class ContentResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List published changelog entries, newest first.
   *
   * @param params - Optional pagination and category filter.
   * @returns A paginated list of changelog entries.
   *
   * @example
   * ```typescript
   * const { data, pagination } = await client.content.listChangelog({ per_page: 10 });
   * console.log(`${pagination.total} entries`);
   * ```
   */
  async listChangelog(params?: ListChangelogParams): Promise<PaginatedResponse<ChangelogEntry>> {
    return this.client.getPaginated<ChangelogEntry>(
      '/v1/changelog',
      params,
    );
  }

  /**
   * Get a single changelog entry.
   *
   * @param id - The changelog entry id.
   * @returns The entry.
   * @throws {NotFoundError} If no entry has that id.
   */
  async getChangelogEntry(id: string | number): Promise<APIResponse<ChangelogEntry>> {
    return this.client.get<ChangelogEntry>(`/v1/changelog/${pathSegment(id)}`);
  }

  /**
   * List published blog posts, newest first.
   *
   * @param params - Optional pagination and category filter.
   * @returns A paginated list of posts. Bodies are omitted; fetch a post by
   *   slug to get its full content.
   */
  async listBlogPosts(params?: ListBlogPostsParams): Promise<PaginatedResponse<BlogPost>> {
    return this.client.getPaginated<BlogPost>('/v1/blog', params);
  }

  /**
   * Get a single blog post, including its full body.
   *
   * @param slug - The post slug.
   * @returns The post.
   * @throws {NotFoundError} If no published post has that slug.
   */
  async getBlogPost(slug: string): Promise<APIResponse<BlogPost>> {
    return this.client.get<BlogPost>(`/v1/blog/${pathSegment(slug)}`);
  }

  /**
   * The notices the website is showing right now, best first. Public, cached
   * for a minute at the edge. An empty list means no banner.
   */
  async listNotices(): Promise<APIResponse<{ notices: SiteNotice[] }>> {
    return this.client.get<{ notices: SiteNotice[] }>('/v1/notices');
  }
}
