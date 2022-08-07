```sh
aws s3api list-objects-v2 --bucket s3p-test-b > list-objects-v2.s3p-test-b.json

aws s3api list-objects-v2 --bucket s3p-test-b --max-items 5 > list-objects-v2.s3p-test-b.p1.json

aws s3api list-objects-v2 --bucket s3p-test-b --max-items 5 --starting-token eyJDb250aW51YXRpb25Ub2tlbiI6IG51bGwsICJib3RvX3RydW5jYXRlX2Ftb3VudCI6IDV9 > list-objects-v2.s3p-test-b.p2.json
```

Note: The CLI output includes a [`NextToken`](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/s3api/list-objects-v2.html#options) property that seems to be non-standard (ie. it is not present in the API response which instead returns a `NextContinuationToken` property if the list is truncated) so I ended up editing **list-objects-v2.s3p-test-b.p1.json** by hand
