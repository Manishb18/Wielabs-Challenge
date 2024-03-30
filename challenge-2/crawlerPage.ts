import { RequestQueue, CheerioCrawler, RequestList } from "crawlee";
import {Company, LaunchPost, Socials, Founder, JobPosting, NewsStory, LocatedAt, QnA, CompanyDetails } from "./interfaces";

//the main array which stores the individual company detailas objects
const companyDetailsArray: CompanyDetails[] = [];

/**
 * this is the main function the holds the core logic of crawling and scraping the website pages.
 * we define two seperate handlers one to handle the company's yc main page and the other 
 * to handle the launchpost page if the company has any launch posts
 * @param companies 
 * @returns companiesDetilsArray
 */
export default async function startCrawling(companies: Company[]): Promise<CompanyDetails[]> {
    console.log("***Scraping Started***");
    const requestList = await RequestList.open({
        sources: companies.map((company) => company.ycUrl),
    });

    const requestQueue = await RequestQueue.open();
    const customHandlers = {
        /**
         * Custom handler to handle the scraping of company page
         * @param param0 
         */
        handleCompanyPage: async ({ request, response, body, $ }: any) => {
            const dataPage = $("div[data-page]").attr("data-page");
            const url = request.url;
            if (dataPage) {
                //parsing the dataPage to extract the data from it
                const data = JSON.parse(dataPage);
                const company = data.props.company;
                const companyName = company.name;

                console.log(`Scraping ${companyName}`);

                //scraping the launches section of the companies page if there are any
                //and adding those urls to the request queue to be handles later
                //such that we crawl into those pages again and scrape the required details
                const launches = data.props.launches;
                if (launches.length > 0) {
                    const promises = launches.map((launch: any) => {
                        return requestQueue.addRequest({ url: launch.url });
                    });
                    await Promise.all(promises);
                }

                //socials stores all the social links of the company
                const socials: Socials = {
                    linkedin: company.linkedin_url || undefined,
                    facebook: company.fb_url || undefined,
                    crunchBase : company.cb_url || undefined,
                    github: company.github_url || undefined,
                    twitter: company.twitter_url || undefined,
                };


                //stores the information of the founders
                const founders: Founder[] = company.founders.map(
                    (founder: any) => ({
                        name: founder.full_name,
                        role: founder.title || undefined,
                        isActive : founder.is_active || undefined,
                        bio: founder.founder_bio,
                        socials: {
                            linkedin: founder.linkedin_url || undefined,
                            twitter: founder.twitter_url || undefined,
                            facebook: founder.facebook_url || undefined,
                            github: founder.github_url || undefined,
                        },
                    })
                );

                //stores the job postings by the company we leave it empty if there are no jobs posted just
                //to make sure that we do not get a reference error while accessing it in the future
                //we can make it undefined if we do not want to display it if there are no job postings
                const jobs: JobPosting[] = data.props.jobPostings.map((job: any) => ({
                    title: job.title,
                    location: job.location,
                    type: job.type,
                    role: job.role,
                    roleSpecificType : job.roleSpecificType || undefined,
                    salaryRange: job.salaryRange,
                    equityRange: job.equityRange,
                    minExperience: job.minExperience,
                    applyUrl: job.applyUrl,
                }));

                //stores the news stories posted by the company in their yc page
                const newsStories: NewsStory[] = data.props.newsItems.map(
                    (news: any) => ({
                        title: news.title,
                        url: news.url,
                        date: news.date,
                    })
                );

                //stores the information about the location of the company
                const located_at : LocatedAt = {
                    location  : company.location || undefined,
                    city : company.city || undefined,
                    country : company.country ||undefined
                }
                
                //stores the tags related to the company ex : [AI, IoT devices...etc]
                const tags: string[] = company.tags;

                //extracts free_response_question_answers from the company object. we only care about those questions which were answered.
                const Questions_answers: QnA[] = company.free_response_question_answers.map((qna :any) => {
                    return {
                        question: qna.question,
                        answer: qna.answer
                    };
                }).filter((qna :any) => qna.answer !== '');

                //final object to store the details combined
                const companyDetails: CompanyDetails = {
                    name: company.name,
                    one_liner : company.one_liner,
                    description: company.long_description,
                    foundingYear: company.year_founded,
                    teamSize: company.team_size,
                    website: company.website,
                    ycUrl: url,
                    ycdc_status : company.ycdc_status,
                    located_at,
                    socials,
                    founders,
                    jobs,
                    newsStories,
                    launches: [],
                    tags,
                };

                //add to the object only if there are any questions which were answered
                if (Questions_answers.length > 0) {
                    companyDetails.free_response_question_answers = Questions_answers;
                }
                //finally pushing the company's object to the main array
                companyDetailsArray.push(companyDetails);
            }
        },
        /**
         * custom handler to handle the scraping of launch post pages of different companies.
         * Once we crawl into the launchpost page of the company, we extract all the necessary information from it
         * and add it to the main object by finding the right object using company name as the key
         * 
         * @param param0 
         */
        handleLaunchPost: async ({ request, response, body, $ }: any) => {
            const dataPage = $("div[data-page]").attr("data-page");
            if (dataPage) {
                const data = JSON.parse(dataPage);
                const post = data.props.post;
                const createdDate = new Date(post.created_at);
                const formattedDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1
                    }/${createdDate.getFullYear()} at ${createdDate.getHours()}:${createdDate.getMinutes() < 10 ? "0" : ""
                    }${createdDate.getMinutes()}`;

                //few launch posts also had youtube videos in them, so we extract the youtube links from the body of the post
                const post_body = post.body;
                const youtubeRegex = /\[ \]\((https:\/\/www\.youtube\.com\/watch\?v=[^\)]+)\)/;
                // Extract the YouTube link
                const matches = post_body.match(youtubeRegex);
                const youtubeLink = matches ? matches[1] : undefined;


                //stores the rquired details of the launch post
                const launchPost: LaunchPost = {
                    title: post.title,
                    tagline: post.tagline,
                    created_by: post.user.name,
                    created_at: formattedDate,
                    total_vote_counts: post.total_vote_count,
                    youtube_link  : youtubeLink,
                    url: post.url,
                    isLatest: data.props.latestLaunch,
                };

                //filter the company relevant to the launch post and add it to the object
                const filteredCompany = companyDetailsArray.find(
                    (company: CompanyDetails) => company.name === post.company.name
                );
                if (filteredCompany) filteredCompany.launches.push(launchPost);
            }
        },
    };

    const crawler = new CheerioCrawler({
        //using both requestlist and requestqueue together as we are already aware about the urls we and 
        //we just need to add the launch post urls dynamically to the queue 
        //requestlist does not allow us to add new urls, so we use requestqueue to do the job
        requestList,
        requestQueue,
        requestHandler: async ({ request, response, body, $ }: any) => {
            const currentUrl = request.url;
            //we find a pattern in the company urls, so we use that to crawl into those by triggering the customhandler
            //related to the company pages handling
            if (currentUrl.startsWith("https://www.ycombinator.com/companies")) {
                await customHandlers.handleCompanyPage({ request, response, body, $ });
            } else {
                await customHandlers.handleLaunchPost({ request, response, body, $ });
            }
        },
        //added maxConcurrency = 1 to maintain the order of the requests,
        //we get the output json in the same order of the companies that we provided in the csv file,
        //we can delete this if we want the requests to be processed quickly 
        //but in that case the order won't be maintained
        maxConcurrency: 1,
    });
    await crawler.run();
    return companyDetailsArray;
}