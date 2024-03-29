import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import timezone from '@/utils/timezone';
import { parseDate } from '@/utils/parse-date';
import iconv from 'iconv-lite';

export const route: Route = {
    path: '/roll',
    categories: ['new-media'],
    example: '/c114/roll',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: {
        source: ['c114.com.cn/news/roll.asp', 'c114.com.cn/'],
    },
    name: '滚动新闻',
    maintainers: ['nczitzk'],
    handler,
    url: 'c114.com.cn/news/roll.asp',
};

async function handler(ctx) {
    const rootUrl = 'https://www.c114.com.cn';
    const currentUrl = `${rootUrl}/news/roll.asp`;

    const response = await got({
        method: 'get',
        url: currentUrl,
        responseType: 'buffer',
    });

    const $ = load(iconv.decode(response.data, 'gbk'));

    let items = $('.new_list_c h6 a')
        .slice(0, ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit')) : 50)
        .toArray()
        .map((item) => {
            item = $(item);

            return {
                title: item.text(),
                link: item.attr('href'),
            };
        });

    items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                    responseType: 'buffer',
                });

                const content = load(iconv.decode(detailResponse.data, 'gbk'));

                item.description = content('.text').html();
                item.author = content('.author').first().text().replace('C114通信网 &nbsp;', '');
                item.pubDate = timezone(parseDate(content('.r_time').text()), +8);
                item.category = content('meta[name="keywords"]').attr('content').split(',');

                return item;
            })
        )
    );

    return {
        title: $('title').text(),
        link: currentUrl,
        item: items,
    };
}
