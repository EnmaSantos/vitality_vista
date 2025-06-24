import React from 'react';
import { Typography, Box, Button, Container, Grid, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f9fbfa',
      fontFamily: 'Lexend, "Noto Sans", sans-serif'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e9f1ec',
        px: 5,
        py: 1.5
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 16, height: 16, color: '#101914' }}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z"
                fill="currentColor"
              />
            </svg>
          </Box>
          <Typography variant="h6" sx={{ color: '#101914', fontWeight: 'bold' }}>
            Vitality Vista
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box sx={{ display: 'flex', gap: 4.5 }}>
            <Typography sx={{ color: '#101914', fontSize: '0.875rem', fontWeight: 500 }}>
              Features
            </Typography>
            <Typography sx={{ color: '#101914', fontSize: '0.875rem', fontWeight: 500 }}>
              Support
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/login"
            sx={{
              bgcolor: '#94e0b2',
              color: '#101914',
              borderRadius: '50px',
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 'bold',
              minWidth: 84,
              '&:hover': {
                bgcolor: '#7dd19a'
              }
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 2.5, px: { xs: 2, md: 10 } }}>
        {/* Hero Section */}
        <Box sx={{
          minHeight: 480,
          background: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDPsHbd6nbJT2i-nbcpAPug2l567zWVlNP_MBuMrh5jAWs9QnuAtX8bZNLXMrTOH7rAvz2kNiThuCRV1gEJAde8tcSKugCIdusNoQZDgfijrA1_77FQgFYHM1fs_L8RMgs8apeHoBL7klYNMweyYkYlBlufPJ2ZIV_w5gbhgDxpLqJXXF6mEIMnMT7KXFT33JdWQFoD0UmXVypHu30tBm0csP4IwLNoXgN7-aWhttyX5M90ZmC8Vt1eTixYfDfmwEVtdtREbDwNuCZa")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          p: 2,
          mb: 5
        }}>
          <Box sx={{ textAlign: 'center', maxWidth: 720 }}>
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: '-0.033em',
                mb: 2
              }}
            >
              Track Your Fitness and Nutrition with Vitality Vista
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 400,
                mb: 3
              }}
            >
              Achieve your health goals with our comprehensive app. Plan workouts, log meals, discover recipes, and monitor your progress all in one place.
            </Typography>
          </Box>
          <Button
            component={RouterLink}
            to="/login"
            sx={{
              bgcolor: '#94e0b2',
              color: '#101914',
              borderRadius: '50px',
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 'bold',
              minWidth: 84,
              '&:hover': {
                bgcolor: '#7dd19a'
              }
            }}
          >
            Get Started
          </Button>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 5 }}>
          <Box sx={{ mb: 4, maxWidth: 720 }}>
            <Typography
              variant="h2"
              sx={{
                color: '#101914',
                fontSize: { xs: '2rem', sm: '2.5rem' },
                fontWeight: 'bold',
                lineHeight: 1.2,
                mb: 2
              }}
            >
              Key Features
            </Typography>
            <Typography
              sx={{
                color: '#101914',
                fontSize: '1rem',
                fontWeight: 400
              }}
            >
              Vitality Vista offers a range of tools to help you stay on track with your fitness and nutrition goals.
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16ZM32,168V88H48v80Zm56,24H64V64H88V192Zm104,0H168V64h24V175.82c0,.06,0,.12,0,.18s0,.12,0,.18V192Zm32-24H208V88h16Z"/>
                  </svg>
                ),
                title: "Exercise Planning",
                description: "Create personalized workout plans tailored to your fitness level and goals."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M184,112a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h64A8,8,0,0,1,184,112Zm-8,24H112a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm48-88V208a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V48A16,16,0,0,1,48,32H208A16,16,0,0,1,224,48ZM48,208H72V48H48Zm160,0V48H88V208H208Z"/>
                  </svg>
                ),
                title: "Food Logging",
                description: "Easily log your meals and track your calorie and macronutrient intake."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M88,48V16a8,8,0,0,1,16,0V48a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V16a8,8,0,0,0-16,0V48A8,8,0,0,0,128,56Zm32,0a8,8,0,0,0,8-8V16a8,8,0,0,0-16,0V48A8,8,0,0,0,160,56Zm92.8,46.4L224,124v60a32,32,0,0,1-32,32H64a32,32,0,0,1-32-32V124L3.2,102.4a8,8,0,0,1,9.6-12.8L32,104V88A16,16,0,0,1,48,72H208a16,16,0,0,1,16,16v16l19.2-14.4a8,8,0,0,1,9.6,12.8ZM208,88H48v96a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16Z"/>
                  </svg>
                ),
                title: "Recipe Discovery",
                description: "Explore a variety of healthy and delicious recipes to inspire your meal planning."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0v94.37L90.73,98a8,8,0,0,1,10.07-.38l58.81,44.11L218.73,90a8,8,0,1,1,10.54,12l-64,56a8,8,0,0,1-10.07.38L96.39,114.29,40,163.63V200H224A8,8,0,0,1,232,208Z"/>
                  </svg>
                ),
                title: "Progress Monitoring",
                description: "Visualize your progress with detailed charts and reports to stay motivated."
              }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{
                  height: '100%',
                  bgcolor: '#f9fbfa',
                  border: '1px solid #d3e3da',
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}>
                  <Box sx={{ color: '#101914' }}>
                    {feature.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#101914',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        mb: 0.5
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#5a8c6e',
                        fontSize: '0.875rem',
                        fontWeight: 400
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Testimonials Section */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h3"
            sx={{
              color: '#101914',
              fontSize: '1.375rem',
              fontWeight: 'bold',
              mb: 2,
              px: 2
            }}
          >
            User Testimonials
          </Typography>
          <Box sx={{
            display: 'flex',
            overflowX: 'auto',
            gap: 1.5,
            px: 2,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}>
            {[
              {
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDS3O1ZhymhqLCN_VJ9LKHQdH4ysSZY21TsTcmeHmGpf4lArBSgYd3NbH5u7topu1rPdffneVK2TRYFOH60tJe8QQiQv4sEAi7VFF3YYKzDzCGbNJTllzAnlpwVQiSAdtCnEistREjUlW6ZSRPCEyalEvnK3X3mib71y9_SVgMN1HWZRfjtCJORy-XfD2tOkk8YQv-ScZeQBQNwEvnESdovSTj9sXJbYYf2FioafJJJoqoEdsVsTnlIumfFMxIljAuT9Il3SAJySTNf",
                name: "Sophia M.",
                testimonial: "Vitality Vista has transformed my fitness journey. The exercise planning and progress tracking features are incredibly motivating."
              },
              {
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBU7MVOhjolYjYJel29O58zJ-MpGd9IS_H5AnrIJzM46tcO_AfjxvYgV_sc1saYE-4Pm3bnCyka137hszELxpMP5ArNBx68Saw3IJBD5vm-dUTpLFtp1GatWLveeyleISXDliWhoVYiyJHu71ZB4Y-7N2zeWmyI3zjcIHImQZc9ZZNXab8ggM6H_DHpBgsTd18ykMMeuqRWwA_Q9aTeF1dBb_TFjwGgkfC5GeXwGbzdcqVVuhJZfzNSsV4lJD-N7EqlvsPNqqrv6yV4",
                name: "Ethan L.",
                testimonial: "I love how easy it is to log my meals and discover new recipes. It's made healthy eating so much more enjoyable."
              },
              {
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2NrjefJDGViTNzAh2dwtWnnSHxS4oZtOYCOhzlQ1Dn7XGnxUMWxxDOYSeXu1ZdtTkeLqjjiMQGqt9Qw8ILvrq-d7rVhj7-2_Iqgk1AXBfL5v6ZKEEPkDTPLiUsdFalVS1XzF3WRTr1BwAzT1jpOhv_GdY2LhktCEUXimNuveyn-b45Ivhccw40l8cRgXCvar-w_bHat2eOWMvx7Sii9br7DB98ZWDBhmjDkR2zojVv07Vb78LOiw10m7Ghzvwt6WxrDRKPV7tZfTZ",
                name: "Olivia R.",
                testimonial: "The app's user-friendly interface and comprehensive features have helped me stay consistent with my health goals."
              }
            ].map((testimonial, index) => (
              <Box key={index} sx={{ minWidth: 160, flex: 1 }}>
                <Box sx={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundImage: `url(${testimonial.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  mb: 2
                }} />
                <Typography
                  sx={{
                    color: '#101914',
                    fontSize: '1rem',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  {testimonial.name}
                </Typography>
                <Typography
                  sx={{
                    color: '#5a8c6e',
                    fontSize: '0.875rem',
                    fontWeight: 400
                  }}
                >
                  "{testimonial.testimonial}"
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* CTA Section */}
        <Box sx={{
          py: 5,
          textAlign: 'center',
          maxWidth: 720,
          mx: 'auto'
        }}>
          <Typography
            variant="h2"
            sx={{
              color: '#101914',
              fontSize: { xs: '2rem', sm: '2.5rem' },
              fontWeight: 'bold',
              lineHeight: 1.2,
              mb: 3
            }}
          >
            Ready to Transform Your Health?
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            sx={{
              bgcolor: '#94e0b2',
              color: '#101914',
              borderRadius: '50px',
              px: { xs: 2, sm: 2.5 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 'bold',
              minWidth: 84,
              '&:hover': {
                bgcolor: '#7dd19a'
              }
            }}
          >
            Get Started
          </Button>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{
        borderTop: '1px solid #e9f1ec',
        py: 5,
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 3,
            mb: 3
          }}>
            <Typography sx={{ color: '#5a8c6e', fontSize: '1rem', fontWeight: 400, minWidth: 160 }}>
              Privacy Policy
            </Typography>
            <Typography sx={{ color: '#5a8c6e', fontSize: '1rem', fontWeight: 400, minWidth: 160 }}>
              Terms of Service
            </Typography>
            <Typography sx={{ color: '#5a8c6e', fontSize: '1rem', fontWeight: 400, minWidth: 160 }}>
              Contact Us
            </Typography>
          </Box>
          <Typography sx={{ color: '#5a8c6e', fontSize: '1rem', fontWeight: 400 }}>
            ©2024 Vitality Vista. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;