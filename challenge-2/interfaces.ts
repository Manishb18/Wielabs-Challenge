/**
 * this file defines all the typescript interfaces that we used in the code base.
 * these are exported and can be used in which ever file they are necessary
 */
export interface Company{
    companyName: string;
    ycUrl: string
}

export interface QnA{
    question : string;
    answer : string;
}
export interface LaunchPost {
    title: string;
    tagline: string;
    created_by: string;
    created_at: string;
    total_vote_counts: number;
    youtube_link : string | undefined;
    url: string;
    isLatest: boolean;
}

export interface Socials {
    linkedin?: string;
    facebook?: string;
    crunchBase?:string,
    github?: string;
    twitter?: string;
}

export interface Founder {
    name: string;
    role?: string | undefined;
    isActive?:boolean | undefined;
    bio: string;
    socials: Socials;
}

export interface JobPosting {
    title: string;
    location: string;
    type: string;
    role: string;
    roleSpecificType ?:string;
    salaryRange: string;
    equityRange: string;
    minExperience: string;
    applyUrl: string;
}

export interface NewsStory {
    title: string;
    url: string;
    date: string;
}

export interface LocatedAt{
    location : string;
    city : string;
    country : string;
}

export interface CompanyDetails {
    name: string;
    one_liner: string;
    description: string;
    foundingYear: number;
    teamSize: number;
    website: string;
    ycUrl: string;
    ycdc_status : string;
    located_at : LocatedAt;
    socials: Socials;
    founders: Founder[];
    jobs: JobPosting[];
    newsStories: NewsStory[];
    launches: LaunchPost[];
    tags: string[];
    free_response_question_answers ?: QnA[] | undefined;
}
