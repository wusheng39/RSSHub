import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import util from './utils';
const news_url = 'https://www.nintendoswitch.com.cn';

export const route: Route = {
    path: '/news/china',
    categories: ['game'],
    example: '/nintendo/news/china',
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
        source: ['nintendoswitch.com.cn/'],
    },
    name: '首页资讯（中国）',
    maintainers: ['NeverBehave'],
    handler,
    url: 'nintendoswitch.com.cn/',
};

async function handler() {
    const response = await got(news_url);

    // 获取Nuxt对象
    const result = await util.nuxtReader(response.data);

    /* newsList[]
        imgUrl: "https://metadata-images.nintendoswitch.com.cn/formal/8332123215251-EAFBA647-9772-DB4B-3C1A-FE0CC41A3966-封面图(1).jpg"
        jumpUrl: "0691bb11-e6a0-4e8c-9b0b-80470ec0a939"
        publishTime: "2022.11.08 11:30:00" // 1667878200000
        title: "8款新品开启预约：超级马力欧系列官方周边"
    */
    if (!result.newsList) {
        throw new Error('新闻信息不存在，请报告这个问题');
    }

    let data = result.newsList.map((item) => ({
        title: item.title,
        description: util.generateImageLink(item.imgUrl),
        link: `${news_url}/topics/${item.jumpUrl}`,
    }));

    data = await util.ProcessNewsChina(data, cache);

    return {
        title: 'Nintendo（中国大陆）主页资讯',
        link: 'https://www.nintendoswitch.com.cn',
        description: 'Nintendo 中国大陆官网刊登的资讯',
        item: data,
    };
}
