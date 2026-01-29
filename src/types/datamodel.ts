export enum WorkflowType {
    Movies = 0,         // maps to 0 in DB workflow_id
    Reviews = 1,  // maps to 1 in DB workflow_id
    MovieReviews = 2    // maps to 2 in DB workflow_id
}

export interface ReviewData {
    criticName?: string;
    title?: string;
    reviewUrl?: string;
    publicationUrl?: string;
    publicationName?: string;
    content?: string;
    isTopCritic?: boolean;
    score?: string | number; // Assuming score can be string or number based on usage
    originalScore?: string;
    // Add any other fields observed in review.data JSON
}