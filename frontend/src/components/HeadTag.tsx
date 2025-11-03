import { Helmet } from "react-helmet";

interface HeadTagProps {
  title: string;
}

const HeadTag: React.FC<HeadTagProps> = ({ title }) => {
  return (
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="" />
      <meta name="keywords" content="" />
      <meta name="author" content="" />
      <link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon" />
      <title>{title}</title>
    </Helmet>
  );
};

export default HeadTag;
